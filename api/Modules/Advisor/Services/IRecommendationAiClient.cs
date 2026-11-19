using Api.Modules.Inventory.Models;

namespace Api.Modules.Advisor.Services;

public interface IRecommendationAiClient
{
    bool IsConfigured { get; }

    Task<IReadOnlyList<long>?> RankAsync(
        string needs,
        string? software,
        string? resolution,
        IReadOnlyList<LaptopModel> candidates,
        CancellationToken cancellationToken);
}
