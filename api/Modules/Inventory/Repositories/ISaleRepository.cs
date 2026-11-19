using Api.Modules.Inventory.Models;

namespace Api.Modules.Inventory.Repositories;

public interface ISaleRepository
{
    Task<IReadOnlyList<Sale>> GetHistoryAsync(
        Guid? userId,
        CancellationToken cancellationToken);

    Task<Sale?> GetByIdAsync(
        long saleId,
        Guid? userId,
        CancellationToken cancellationToken);

    Task<string?> GetSellerNameAsync(Guid userId, CancellationToken cancellationToken);
}
