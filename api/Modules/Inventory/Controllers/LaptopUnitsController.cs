using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Modules.Inventory.Controllers;

[ApiController]
[Route("api/units")]
[Authorize(Roles = "administrador,vendedor")]
public sealed class LaptopUnitsController(ILaptopUnitService unitService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<LaptopUnitResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LaptopUnitResponse>>> GetAll(
        [FromQuery] LaptopUnitQuery query,
        CancellationToken cancellationToken)
    {
        var units = await unitService.GetAllAsync(query, cancellationToken);
        return Ok(units);
    }

    [HttpGet("{id:long}")]
    [ProducesResponseType<LaptopUnitResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LaptopUnitResponse>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var unit = await unitService.GetByIdAsync(id, cancellationToken);
        return unit is null ? NotFound() : Ok(unit);
    }

    [HttpPost]
    [Authorize(Roles = "administrador")]
    [ProducesResponseType<LaptopUnitResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LaptopUnitResponse>> Create(
        SaveLaptopUnitRequest request,
        CancellationToken cancellationToken)
    {
        var (result, unit) = await unitService.CreateAsync(request, cancellationToken);
        if (result == UnitWriteResult.ModelNotFound)
        {
            return NotFound(new ProblemDetails
            {
                Title = "El modelo indicado no existe.",
                Status = StatusCodes.Status404NotFound
            });
        }

        if (result == UnitWriteResult.DuplicateSerialNumber)
        {
            return Conflict(new ProblemDetails
            {
                Title = "El número de serie ya está registrado.",
                Status = StatusCodes.Status409Conflict
            });
        }

        return CreatedAtAction(nameof(GetById), new { id = unit!.Id }, unit);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        long id,
        SaveLaptopUnitRequest request,
        CancellationToken cancellationToken)
    {
        var result = await unitService.UpdateAsync(id, request, cancellationToken);
        return result switch
        {
            UnitWriteResult.UnitNotFound => NotFound(),
            UnitWriteResult.ModelNotFound => NotFound(new ProblemDetails
            {
                Title = "El modelo indicado no existe.",
                Status = StatusCodes.Status404NotFound
            }),
            UnitWriteResult.DuplicateSerialNumber => Conflict(new ProblemDetails
            {
                Title = "El número de serie ya está registrado.",
                Status = StatusCodes.Status409Conflict
            }),
            UnitWriteResult.UnitNotAvailable => Conflict(new ProblemDetails
            {
                Title = "Solo se pueden modificar unidades disponibles sin historial de venta.",
                Status = StatusCodes.Status409Conflict
            }),
            _ => NoContent()
        };
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        var result = await unitService.DeleteAsync(id, cancellationToken);
        return result switch
        {
            UnitDeleteResult.UnitNotFound => NotFound(),
            UnitDeleteResult.HasSaleHistory => Conflict(new ProblemDetails
            {
                Title = "No se puede eliminar una unidad vendida o con historial de venta.",
                Status = StatusCodes.Status409Conflict
            }),
            _ => NoContent()
        };
    }
}
