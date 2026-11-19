using System.Security.Claims;
using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Modules.Inventory.Controllers;

[ApiController]
[Route("api/sales")]
[Authorize(Roles = "administrador,vendedor")]
public sealed class SalesController(
    ISaleService saleService,
    ISaleHistoryService historyService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<SaleHistoryItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SaleHistoryItemResponse>>> GetHistory(
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId))
        {
            return Unauthorized();
        }

        Guid? scopeUserId = User.IsInRole("administrador") ? null : userId;
        return Ok(await historyService.GetHistoryAsync(scopeUserId, cancellationToken));
    }

    [HttpGet("{id:long}")]
    [ProducesResponseType<SaleHistoryDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleHistoryDetailResponse>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId))
        {
            return Unauthorized();
        }

        Guid? scopeUserId = User.IsInRole("administrador") ? null : userId;
        var sale = await historyService.GetByIdAsync(id, scopeUserId, cancellationToken);
        return sale is null
            ? NotFound(new ProblemDetails
            {
                Title = "No se encontró la venta solicitada.",
                Status = StatusCodes.Status404NotFound
            })
            : Ok(sale);
    }

    [HttpPost]
    [ProducesResponseType<SaleResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
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
            SaleCreateResult.PaymentRejected =>
                UnprocessableEntity(new ProblemDetails
                {
                    Title = error,
                    Status = StatusCodes.Status422UnprocessableEntity,
                    Extensions = { ["code"] = "PAYMENT_REJECTED" }
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
