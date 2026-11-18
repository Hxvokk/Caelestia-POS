using Api.Modules.Inventory.Models;

namespace Api.Modules.Inventory.Repositories;

public interface IBrandRepository
{
    Task<IReadOnlyList<Brand>> GetAllAsync(CancellationToken cancellationToken);

    Task<Brand?> GetByIdAsync(long id, CancellationToken cancellationToken);

    Task<Brand?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(
        string name,
        CancellationToken cancellationToken,
        long? excludedBrandId = null);

    Task<bool> HasModelsAsync(long id, CancellationToken cancellationToken);

    Task AddAsync(Brand brand, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task DeleteAsync(Brand brand, CancellationToken cancellationToken);
}
