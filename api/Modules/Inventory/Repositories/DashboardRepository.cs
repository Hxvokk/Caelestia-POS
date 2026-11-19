using Api.Data;
using Api.Modules.Inventory.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Inventory.Repositories;

public sealed class DashboardRepository(AppDbContext dbContext) : IDashboardRepository
{
    public async Task<DashboardResponse> GetMetricsAsync(CancellationToken cancellationToken)
    {
        var completedSalesTotal = await dbContext.Sales
            .Where(sale => sale.Status == "completada")
            .SumAsync(sale => (decimal?)sale.Total, cancellationToken) ?? 0m;
        var soldUnits = await dbContext.LaptopUnits
            .LongCountAsync(unit => unit.Status == "vendida", cancellationToken);
        var availableUnits = await dbContext.LaptopUnits
            .LongCountAsync(unit => unit.Status == "disponible", cancellationToken);
        var registeredModels = await dbContext.LaptopModels
            .LongCountAsync(cancellationToken);

        return new DashboardResponse(
            completedSalesTotal,
            soldUnits,
            availableUnits,
            registeredModels);
    }
}
