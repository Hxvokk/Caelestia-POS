using Api.Modules.Users.Contracts;
using Api.Modules.Users.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Modules.Users.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "administrador")]
public sealed class VendorsController(IVendorService vendorService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<VendorResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<VendorResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var vendors = await vendorService.GetAllAsync(cancellationToken);
        return Ok(vendors);
    }

    [HttpPost]
    [ProducesResponseType<VendorResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<VendorResponse>> Create(
        CreateVendorRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var vendor = await vendorService.CreateAsync(
                request.Name,
                request.Email,
                request.Password,
                cancellationToken);
            return Created("/api/users", vendor);
        }
        catch (VendorEmailAlreadyExistsException exception)
        {
            return Conflict(CreateProblem(exception.Message, StatusCodes.Status409Conflict));
        }
        catch (SupabaseAdminNotConfiguredException exception)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                CreateProblem(exception.Message, StatusCodes.Status503ServiceUnavailable));
        }
        catch (SupabaseAuthAdminException exception) when (exception.IsDuplicateEmail)
        {
            return Conflict(CreateProblem("Ya existe una cuenta con ese correo.", StatusCodes.Status409Conflict));
        }
        catch (SupabaseAuthAdminException exception)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                CreateProblem(exception.Message, StatusCodes.Status502BadGateway));
        }
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> SetStatus(
        Guid id,
        UpdateVendorStatusRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var updated = await vendorService.SetActiveAsync(
                id,
                request.IsActive!.Value,
                cancellationToken);
            return updated
                ? NoContent()
                : NotFound(CreateProblem("No se encontró la cuenta de vendedor.", StatusCodes.Status404NotFound));
        }
        catch (SupabaseAdminNotConfiguredException exception)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                CreateProblem(exception.Message, StatusCodes.Status503ServiceUnavailable));
        }
        catch (SupabaseAuthAdminException exception)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                CreateProblem(exception.Message, StatusCodes.Status502BadGateway));
        }
    }

    private static ProblemDetails CreateProblem(string title, int status) =>
        new() { Title = title, Status = status };
}
