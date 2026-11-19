using Api.Data;
using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests;

public sealed class SaleServiceTests
{
    [Theory]
    [InlineData("debito")]
    [InlineData("credito")]
    public async Task RejectedCardPaymentReturnsBeforeOpeningDatabaseOrWritingEntities(string method)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(
                "Host=127.0.0.1;Port=1;Database=unused;Username=unused;Password=unused;Timeout=1")
            .Options;
        await using var dbContext = new AppDbContext(options);
        var service = new SaleService(dbContext);

        var (result, sale, error) = await service.CreateAsync(
            Guid.NewGuid(),
            new CreateSaleRequest
            {
                UnitIds = [1],
                PaymentMethod = method,
                SimulatedCardResult = "rechazado"
            },
            CancellationToken.None);

        Assert.Equal(SaleCreateResult.PaymentRejected, result);
        Assert.Null(sale);
        Assert.Contains("No se registraron ventas", error);
        Assert.Empty(dbContext.ChangeTracker.Entries());
    }
}
