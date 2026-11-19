using Api.Modules.Inventory.Contracts;

namespace Api.Modules.Inventory.Services;

public interface ISaleHistoryService
{
    Task<IReadOnlyList<SaleHistoryItemResponse>> GetHistoryAsync(
        Guid? userId,
        CancellationToken cancellationToken);

    Task<SaleHistoryDetailResponse?> GetByIdAsync(
        long saleId,
        Guid? userId,
        CancellationToken cancellationToken);
}
