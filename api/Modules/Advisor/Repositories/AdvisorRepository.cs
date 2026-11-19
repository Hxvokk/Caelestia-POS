using Api.Data;
using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Advisor.Repositories;

public sealed class AdvisorRepository(AppDbContext dbContext) : IAdvisorRepository
{
    public async Task<IReadOnlyList<LaptopModel>> GetAvailableModelsWithinBudgetAsync(
        decimal budget,
        CancellationToken cancellationToken) =>
        await dbContext.LaptopModels
            .AsNoTracking()
            .Include(model => model.Brand)
            .Where(model =>
                model.Price <= budget &&
                model.Units.Any(unit => unit.Status == "disponible"))
            .OrderBy(model => model.Price)
            .ThenBy(model => model.Id)
            .ToListAsync(cancellationToken);
}
