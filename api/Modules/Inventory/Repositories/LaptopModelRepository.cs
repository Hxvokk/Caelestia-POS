using Api.Data;
using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Inventory.Repositories;

public sealed class LaptopModelRepository(AppDbContext dbContext) : ILaptopModelRepository
{
    public async Task<IReadOnlyList<LaptopModel>> GetAllAsync(
        LaptopModelQuery query,
        CancellationToken cancellationToken)
    {
        var models = dbContext.LaptopModels
            .AsNoTracking()
            .Include(model => model.Brand)
            .AsQueryable();

        if (query.BrandId.HasValue)
        {
            models = models.Where(model => model.BrandId == query.BrandId.Value);
        }

        if (query.MinPrice.HasValue)
        {
            models = models.Where(model => model.Price >= query.MinPrice.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            models = models.Where(model => model.Price <= query.MaxPrice.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Processor))
        {
            var processor = query.Processor.Trim().ToLower();
            models = models.Where(model => model.ProcessorOrChip.ToLower().Contains(processor));
        }

        if (query.MinMemoryGb.HasValue)
        {
            var minimumMemory = query.MinMemoryGb.Value;
            models = models.Where(model =>
                model.RamGb >= minimumMemory || model.UnifiedMemoryGb >= minimumMemory);
        }

        if (query.AvailableOnly == true)
        {
            models = models.Where(model =>
                model.Units.Any(unit => unit.Status == "disponible"));
        }

        return await models
            .OrderBy(model => model.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<LaptopModel?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        dbContext.LaptopModels
            .AsNoTracking()
            .Include(model => model.Brand)
            .SingleOrDefaultAsync(model => model.Id == id, cancellationToken);

    public Task<LaptopModel?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken) =>
        dbContext.LaptopModels
            .Include(model => model.Brand)
            .SingleOrDefaultAsync(model => model.Id == id, cancellationToken);

    public Task<Brand?> GetBrandByIdAsync(long id, CancellationToken cancellationToken) =>
        dbContext.Brands.SingleOrDefaultAsync(brand => brand.Id == id, cancellationToken);

    public Task<bool> SkuExistsAsync(
        long brandId,
        string sku,
        long? excludedModelId,
        CancellationToken cancellationToken) =>
        dbContext.LaptopModels.AnyAsync(
            model => model.BrandId == brandId
                && model.Sku == sku
                && (!excludedModelId.HasValue || model.Id != excludedModelId.Value),
            cancellationToken);

    public Task<bool> BrandExistsAsync(long id, CancellationToken cancellationToken) =>
        dbContext.Brands.AnyAsync(brand => brand.Id == id, cancellationToken);

    public Task<bool> HasUnitsAsync(long modelId, CancellationToken cancellationToken) =>
        dbContext.LaptopUnits.AnyAsync(unit => unit.LaptopModelId == modelId, cancellationToken);

    public async Task AddAsync(LaptopModel model, CancellationToken cancellationToken)
    {
        dbContext.LaptopModels.Add(model);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);

    public async Task DeleteAsync(LaptopModel model, CancellationToken cancellationToken)
    {
        dbContext.LaptopModels.Remove(model);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
