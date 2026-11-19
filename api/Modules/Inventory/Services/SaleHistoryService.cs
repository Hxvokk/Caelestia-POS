using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Repositories;

namespace Api.Modules.Inventory.Services;

public sealed class SaleHistoryService(ISaleRepository repository) : ISaleHistoryService
{
    public async Task<IReadOnlyList<SaleHistoryItemResponse>> GetHistoryAsync(
        Guid? userId,
        CancellationToken cancellationToken)
    {
        var sales = await repository.GetHistoryAsync(userId, cancellationToken);
        return sales
            .Select(sale => new SaleHistoryItemResponse(
                sale.Id,
                sale.Date,
                sale.Total,
                sale.Status,
                sale.Payment.Method,
                sale.Details.Count))
            .ToArray();
    }

    public async Task<SaleHistoryDetailResponse?> GetByIdAsync(
        long saleId,
        Guid? userId,
        CancellationToken cancellationToken)
    {
        var sale = await repository.GetByIdAsync(saleId, userId, cancellationToken);
        if (sale is null)
        {
            return null;
        }

        var sellerName = await repository.GetSellerNameAsync(sale.UserId, cancellationToken);
        return new SaleHistoryDetailResponse(
            sale.Id,
            sale.UserId,
            sellerName ?? "Usuario",
            sale.Date,
            sale.Total,
            sale.Status,
            sale.Payment.Method,
            sale.Payment.AmountReceived,
            sale.Payment.Change,
            sale.Payment.IsSimulated,
            sale.Details.Select(detail =>
            {
                var unit = detail.LaptopUnit;
                var model = unit.LaptopModel;
                return new SaleLineResponse(
                    unit.Id,
                    unit.SerialNumber,
                    model.Brand.Name,
                    model.Name,
                    detail.UnitPrice);
            }).ToArray());
    }
}
