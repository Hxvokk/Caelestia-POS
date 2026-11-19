using Api.Modules.Advisor.Contracts;
using Api.Modules.Advisor.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Modules.Advisor.Controllers;

[ApiController]
[Route("api/advisor")]
[Authorize(Roles = "administrador,vendedor")]
public sealed class AdvisorController(IRecommendationService recommendationService) : ControllerBase
{
    [HttpPost("recommendations")]
    [ProducesResponseType<LaptopRecommendationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LaptopRecommendationResponse>> Recommend(
        LaptopRecommendationRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Needs))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Describe brevemente lo que necesita el cliente.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        return Ok(await recommendationService.RecommendAsync(request, cancellationToken));
    }
}
