using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Repositories;

namespace Api.Modules.Inventory.Services;

public sealed class DashboardService(IDashboardRepository repository) : IDashboardService
{
    public Task<DashboardResponse> GetMetricsAsync(CancellationToken cancellationToken) =>
        repository.GetMetricsAsync(cancellationToken);
}
