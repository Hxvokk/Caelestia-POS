using Api.Data;
using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Inventory.Repositories;

public sealed class BrandRepository(AppDbContext dbContext) : IBrandRepository
{
    public async Task<IReadOnlyList<Brand>> GetAllAsync(CancellationToken cancellationToken) =>
        await dbContext.Brands
            .AsNoTracking()
            .OrderBy(brand => brand.Name)
            .ToListAsync(cancellationToken);

    public Task<Brand?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        dbContext.Brands.AsNoTracking().SingleOrDefaultAsync(brand => brand.Id == id, cancellationToken);

    public Task<Brand?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken) =>
        dbContext.Brands.SingleOrDefaultAsync(brand => brand.Id == id, cancellationToken);

    public Task<bool> NameExistsAsync(
        string name,
        CancellationToken cancellationToken,
        long? excludedBrandId = null) =>
        dbContext.Brands.AnyAsync(
            brand => brand.Name.ToLower() == name.ToLower()
                && (!excludedBrandId.HasValue || brand.Id != excludedBrandId.Value),
            cancellationToken);

    public Task<bool> HasModelsAsync(long id, CancellationToken cancellationToken) =>
        dbContext.LaptopModels.AnyAsync(model => model.BrandId == id, cancellationToken);

    public async Task AddAsync(Brand brand, CancellationToken cancellationToken)
    {
        dbContext.Brands.Add(brand);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);

    public async Task DeleteAsync(Brand brand, CancellationToken cancellationToken)
    {
        dbContext.Brands.Remove(brand);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
