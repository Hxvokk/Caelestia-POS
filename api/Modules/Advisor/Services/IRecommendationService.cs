using Api.Modules.Advisor.Contracts;

namespace Api.Modules.Advisor.Services;

public interface IRecommendationService
{
    Task<LaptopRecommendationResponse> RecommendAsync(
        LaptopRecommendationRequest request,
        CancellationToken cancellationToken);
}
