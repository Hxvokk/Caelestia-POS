using Api.Modules.Inventory.Contracts;

namespace Api.Modules.Inventory.Services;

public interface ILaptopModelService
{
    Task<IReadOnlyList<LaptopModelResponse>> GetAllAsync(
        LaptopModelQuery query,
        CancellationToken cancellationToken);

    Task<LaptopModelResponse?> GetByIdAsync(long id, CancellationToken cancellationToken);

    Task<(ModelWriteResult Result, LaptopModelResponse? Model)> CreateAsync(
        SaveLaptopModelRequest request,
        CancellationToken cancellationToken);

    Task<ModelWriteResult> UpdateAsync(
        long id,
        SaveLaptopModelRequest request,
        CancellationToken cancellationToken);

    Task<ModelDeleteResult> DeleteAsync(long id, CancellationToken cancellationToken);
}

public enum ModelWriteResult
{
    Success,
    BrandNotFound,
    ModelNotFound,
    DuplicateSku
}

public enum ModelDeleteResult
{
    Deleted,
    ModelNotFound,
    HasUnits
}
