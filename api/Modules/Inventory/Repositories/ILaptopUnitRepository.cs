using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Models;

namespace Api.Modules.Inventory.Repositories;

public interface ILaptopUnitRepository
{
    Task<IReadOnlyList<LaptopUnit>> GetAllAsync(
        LaptopUnitQuery query,
        CancellationToken cancellationToken);

    Task<LaptopUnit?> GetByIdAsync(long id, CancellationToken cancellationToken);

    Task<LaptopUnit?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken);

    Task<bool> ModelExistsAsync(long modelId, CancellationToken cancellationToken);

    Task<bool> SerialNumberExistsAsync(string serialNumber, CancellationToken cancellationToken);

    Task<bool> SerialNumberExistsForOtherUnitAsync(
        long unitId,
        string serialNumber,
        CancellationToken cancellationToken);

    Task<bool> HasSaleHistoryAsync(long unitId, CancellationToken cancellationToken);

    Task AddAsync(LaptopUnit unit, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task DeleteAsync(LaptopUnit unit, CancellationToken cancellationToken);
}
