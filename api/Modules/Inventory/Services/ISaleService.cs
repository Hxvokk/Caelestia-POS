using Api.Modules.Inventory.Contracts;

namespace Api.Modules.Inventory.Services;

public enum SaleCreateResult
{
    Success,
    InvalidUnits,
    UnitNotFound,
    UnitUnavailable,
    InvalidPayment,
    PaymentRejected,
    Conflict
}

public interface ISaleService
{
    Task<(SaleCreateResult Result, SaleResponse? Sale, string? Error)> CreateAsync(
        Guid userId,
        CreateSaleRequest request,
        CancellationToken cancellationToken);
}
