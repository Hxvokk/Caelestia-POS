using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Models;

namespace Api.Modules.Inventory.Repositories;

public interface ILaptopModelRepository
{
    Task<IReadOnlyList<LaptopModel>> GetAllAsync(LaptopModelQuery query, CancellationToken cancellationToken);

    Task<LaptopModel?> GetByIdAsync(long id, CancellationToken cancellationToken);

    Task<LaptopModel?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken);

    Task<Brand?> GetBrandByIdAsync(long id, CancellationToken cancellationToken);

    Task<bool> SkuExistsAsync(
        long brandId,
        string sku,
        long? excludedModelId,
        CancellationToken cancellationToken);

    Task<bool> BrandExistsAsync(long id, CancellationToken cancellationToken);

    Task<bool> HasUnitsAsync(long modelId, CancellationToken cancellationToken);

    Task AddAsync(LaptopModel model, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task DeleteAsync(LaptopModel model, CancellationToken cancellationToken);
}
