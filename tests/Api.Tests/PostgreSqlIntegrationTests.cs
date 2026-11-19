using System.Diagnostics;
using Api.Data;
using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Models;
using Api.Modules.Inventory.Repositories;
using Api.Modules.Inventory.Services;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

namespace Api.Tests;

public sealed class PostgreSqlIntegrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("caelestia_test")
        .WithUsername("test")
        .WithPassword("test-only-password")
        .Build();

    private DbContextOptions<AppDbContext> _options = null!;
    private long _unitId;
    private Guid _userId;

    public async Task InitializeAsync()
    {
        if (!PostgreSqlIntegrationFactAttribute.IsEnabled)
        {
            return;
        }

        await _postgres.StartAsync();
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var dbContext = new AppDbContext(_options);
        await dbContext.Database.EnsureCreatedAsync();

        _userId = Guid.NewGuid();
        var brand = new Brand { Name = "Automated Integration Fixture" };
        var model = new LaptopModel
        {
            Brand = brand,
            Name = "Temporary Integration Fixture",
            ProcessorOrChip = "Synthetic test CPU",
            StorageGb = 512,
            StorageType = "SSD",
            Price = 12_000m
        };

        dbContext.UserProfiles.Add(new UserProfile
        {
            Id = _userId,
            Name = "Integration Test",
            Email = "integration-test@example.invalid",
            Role = "administrador",
            IsActive = true
        });
        dbContext.Brands.Add(brand);
        dbContext.LaptopModels.Add(model);
        await dbContext.SaveChangesAsync();

        var units = Enumerable.Range(1, 500)
            .Select(index => new LaptopUnit
            {
                LaptopModelId = model.Id,
                SerialNumber = $"AUTOMATED-TEST-{index:D4}",
                Status = "disponible"
            })
            .ToArray();
        dbContext.LaptopUnits.AddRange(units);
        await dbContext.SaveChangesAsync();
        _unitId = units[0].Id;
    }

    public async Task DisposeAsync()
    {
        if (PostgreSqlIntegrationFactAttribute.IsEnabled)
        {
            await _postgres.DisposeAsync();
        }
    }

    [PostgreSqlIntegrationFact]
    public async Task ConcurrentSalesOfOneUnitPersistOnlyOneSale()
    {
        var startGate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        async Task<(SaleCreateResult Result, SaleResponse? Sale, string? Error)> AttemptSaleAsync()
        {
            await startGate.Task;
            await using var dbContext = new AppDbContext(_options);
            var service = new SaleService(dbContext);
            return await service.CreateAsync(
                _userId,
                new CreateSaleRequest
                {
                    UnitIds = [_unitId],
                    PaymentMethod = "debito",
                    SimulatedCardResult = "aprobado"
                },
                CancellationToken.None);
        }

        var firstSale = AttemptSaleAsync();
        var secondSale = AttemptSaleAsync();
        startGate.SetResult();
        var results = await Task.WhenAll(firstSale, secondSale);

        Assert.Single(results, result => result.Result == SaleCreateResult.Success);
        Assert.Single(results, result =>
            result.Result is SaleCreateResult.UnitUnavailable or SaleCreateResult.Conflict);

        await using var verificationContext = new AppDbContext(_options);
        Assert.Equal(1, await verificationContext.Sales.LongCountAsync());
        Assert.Equal(1, await verificationContext.SaleDetails.LongCountAsync());
        Assert.Equal(1, await verificationContext.SalePayments.LongCountAsync());
        Assert.Equal(
            "vendida",
            await verificationContext.LaptopUnits
                .Where(unit => unit.Id == _unitId)
                .Select(unit => unit.Status)
                .SingleAsync());
    }

    [PostgreSqlIntegrationFact]
    public async Task ListingFiveHundredUnitsCompletesWithinThreeSeconds()
    {
        await using var dbContext = new AppDbContext(_options);
        var repository = new LaptopUnitRepository(dbContext);

        _ = await repository.GetAllAsync(new LaptopUnitQuery(), CancellationToken.None);
        var stopwatch = Stopwatch.StartNew();
        var units = await repository.GetAllAsync(new LaptopUnitQuery(), CancellationToken.None);
        stopwatch.Stop();

        Assert.Equal(500, units.Count);
        Assert.True(
            stopwatch.Elapsed < TimeSpan.FromSeconds(3),
            $"Listing 500 isolated test units took {stopwatch.Elapsed.TotalMilliseconds:F0} ms.");
    }
}

[AttributeUsage(AttributeTargets.Method)]
public sealed class PostgreSqlIntegrationFactAttribute : FactAttribute
{
    public static bool IsEnabled =>
        string.Equals(
            Environment.GetEnvironmentVariable("CAELESTIA_RUN_POSTGRES_TESTS"),
            "1",
            StringComparison.Ordinal);

    public PostgreSqlIntegrationFactAttribute()
    {
        if (!IsEnabled)
        {
            Skip = "Set CAELESTIA_RUN_POSTGRES_TESTS=1 to run isolated PostgreSQL container tests.";
        }
    }
}
