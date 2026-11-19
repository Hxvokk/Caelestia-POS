using Api.Modules.Inventory.Contracts;

namespace Api.Modules.Inventory.Services;

public interface IDashboardService
{
    Task<DashboardResponse> GetMetricsAsync(CancellationToken cancellationToken);
}
