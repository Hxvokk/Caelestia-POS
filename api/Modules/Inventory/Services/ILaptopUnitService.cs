using Api.Modules.Inventory.Contracts;

namespace Api.Modules.Inventory.Services;

public interface ILaptopUnitService
{
    Task<IReadOnlyList<LaptopUnitResponse>> GetAllAsync(
        LaptopUnitQuery query,
        CancellationToken cancellationToken);

    Task<LaptopUnitResponse?> GetByIdAsync(long id, CancellationToken cancellationToken);

    Task<(UnitWriteResult Result, LaptopUnitResponse? Unit)> CreateAsync(
        SaveLaptopUnitRequest request,
        CancellationToken cancellationToken);

    Task<UnitWriteResult> UpdateAsync(
        long id,
        SaveLaptopUnitRequest request,
        CancellationToken cancellationToken);

    Task<UnitDeleteResult> DeleteAsync(long id, CancellationToken cancellationToken);
}

public enum UnitWriteResult
{
    Success,
    ModelNotFound,
    UnitNotFound,
    DuplicateSerialNumber,
    UnitNotAvailable
}

public enum UnitDeleteResult
{
    Deleted,
    UnitNotFound,
    HasSaleHistory
}
