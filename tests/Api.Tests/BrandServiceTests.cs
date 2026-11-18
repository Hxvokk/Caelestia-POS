using Api.Modules.Inventory.Models;
using Api.Modules.Inventory.Repositories;
using Api.Modules.Inventory.Services;
using Xunit;

namespace Api.Tests;

public sealed class BrandServiceTests
{
    [Fact]
    public async Task UpdateTrimsNameAndSavesBrand()
    {
        var brand = new Brand { Id = 1, Name = "Old" };
        var repository = new FakeBrandRepository([brand]);
        var service = new BrandService(repository);

        var result = await service.UpdateAsync(1, "  New Name  ", CancellationToken.None);

        Assert.Equal(BrandUpdateResult.Success, result);
        Assert.Equal("New Name", brand.Name);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task UpdateRejectsDuplicateName()
    {
        var first = new Brand { Id = 1, Name = "Acer" };
        var second = new Brand { Id = 2, Name = "Dell" };
        var repository = new FakeBrandRepository([first, second]);
        var service = new BrandService(repository);

        var result = await service.UpdateAsync(2, " acer ", CancellationToken.None);

        Assert.Equal(BrandUpdateResult.DuplicateName, result);
        Assert.Equal("Dell", second.Name);
        Assert.Equal(0, repository.SaveCount);
    }

    [Fact]
    public async Task DeleteRejectsBrandWithModels()
    {
        var brand = new Brand { Id = 1, Name = "Acer" };
        var repository = new FakeBrandRepository([brand]) { BrandIdsWithModels = [1] };
        var service = new BrandService(repository);

        var result = await service.DeleteAsync(1, CancellationToken.None);

        Assert.Equal(BrandDeleteResult.HasModels, result);
        Assert.Contains(brand, repository.Brands);
        Assert.Equal(0, repository.DeleteCount);
    }

    [Fact]
    public async Task DeleteRemovesBrandWithoutModels()
    {
        var brand = new Brand { Id = 1, Name = "Acer" };
        var repository = new FakeBrandRepository([brand]);
        var service = new BrandService(repository);

        var result = await service.DeleteAsync(1, CancellationToken.None);

        Assert.Equal(BrandDeleteResult.Deleted, result);
        Assert.Empty(repository.Brands);
        Assert.Equal(1, repository.DeleteCount);
    }

    private sealed class FakeBrandRepository(List<Brand> brands) : IBrandRepository
    {
        public List<Brand> Brands { get; } = brands;
        public HashSet<long> BrandIdsWithModels { get; init; } = [];
        public int SaveCount { get; private set; }
        public int DeleteCount { get; private set; }

        public Task<IReadOnlyList<Brand>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Brand>>(Brands);

        public Task<Brand?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
            Task.FromResult(Brands.SingleOrDefault(brand => brand.Id == id));

        public Task<Brand?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken) =>
            Task.FromResult(Brands.SingleOrDefault(brand => brand.Id == id));

        public Task<bool> NameExistsAsync(
            string name,
            CancellationToken cancellationToken,
            long? excludedBrandId = null) =>
            Task.FromResult(Brands.Any(brand =>
                brand.Id != excludedBrandId && string.Equals(brand.Name, name, StringComparison.OrdinalIgnoreCase)));

        public Task<bool> HasModelsAsync(long id, CancellationToken cancellationToken) =>
            Task.FromResult(BrandIdsWithModels.Contains(id));

        public Task AddAsync(Brand brand, CancellationToken cancellationToken)
        {
            Brands.Add(brand);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken)
        {
            SaveCount++;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Brand brand, CancellationToken cancellationToken)
        {
            Brands.Remove(brand);
            DeleteCount++;
            return Task.CompletedTask;
        }
    }
}
