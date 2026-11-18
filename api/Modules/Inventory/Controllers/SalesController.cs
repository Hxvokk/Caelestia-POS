using System.Security.Claims;
using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Modules.Inventory.Controllers;

[ApiController]
[Route("api/sales")]
[Authorize(Roles = "administrador,vendedor")]
public sealed class SalesController(ISaleService saleService) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<SaleResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SaleResponse>> Create(
        CreateSaleRequest request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId))
        {
            return Unauthorized();
        }

        var (result, sale, error) = await saleService.CreateAsync(userId, request, cancellationToken);
        return result switch
        {
            SaleCreateResult.InvalidUnits or SaleCreateResult.InvalidPayment =>
                BadRequest(new ProblemDetails
                {
                    Title = error,
                    Status = StatusCodes.Status400BadRequest
                }),
            SaleCreateResult.UnitNotFound =>
                NotFound(new ProblemDetails
                {
                    Title = error,
                    Status = StatusCodes.Status404NotFound
                }),
            SaleCreateResult.UnitUnavailable or SaleCreateResult.Conflict =>
                Conflict(new ProblemDetails
                {
                    Title = error,
                    Status = StatusCodes.Status409Conflict
                }),
            _ => StatusCode(StatusCodes.Status201Created, sale)
        };
    }
}
