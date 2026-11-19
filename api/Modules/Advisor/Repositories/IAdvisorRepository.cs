using Api.Modules.Inventory.Models;

namespace Api.Modules.Advisor.Repositories;

public interface IAdvisorRepository
{
    Task<IReadOnlyList<LaptopModel>> GetAvailableModelsWithinBudgetAsync(
        decimal budget,
        CancellationToken cancellationToken);
}
