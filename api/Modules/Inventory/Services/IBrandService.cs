using Api.Modules.Inventory.Models;

namespace Api.Modules.Inventory.Services;

public interface IBrandService
{
    Task<IReadOnlyList<Brand>> GetAllAsync(CancellationToken cancellationToken);

    Task<Brand?> GetByIdAsync(long id, CancellationToken cancellationToken);

    Task<Brand?> CreateAsync(string name, CancellationToken cancellationToken);

    Task<BrandUpdateResult> UpdateAsync(long id, string name, CancellationToken cancellationToken);

    Task<BrandDeleteResult> DeleteAsync(long id, CancellationToken cancellationToken);
}

public enum BrandUpdateResult
{
    Success,
    BrandNotFound,
    DuplicateName
}

public enum BrandDeleteResult
{
    Deleted,
    BrandNotFound,
    HasModels
}
