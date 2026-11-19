using Api.Modules.Inventory.Contracts;

namespace Api.Modules.Inventory.Repositories;

public interface IDashboardRepository
{
    Task<DashboardResponse> GetMetricsAsync(CancellationToken cancellationToken);
}
