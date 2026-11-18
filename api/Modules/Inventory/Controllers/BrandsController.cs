using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Modules.Inventory.Controllers;

[ApiController]
[Route("api/brands")]
[Authorize]
public sealed class BrandsController(IBrandService brandService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<BrandResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BrandResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var brands = await brandService.GetAllAsync(cancellationToken);
        return Ok(brands.Select(brand => new BrandResponse(brand.Id, brand.Name)).ToArray());
    }

    [HttpGet("{id:long}")]
    [ProducesResponseType<BrandResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BrandResponse>> GetById(long id, CancellationToken cancellationToken)
    {
        var brand = await brandService.GetByIdAsync(id, cancellationToken);
        return brand is null ? NotFound() : Ok(new BrandResponse(brand.Id, brand.Name));
    }

    [HttpPost]
    [Authorize(Roles = "administrador")]
    [ProducesResponseType<BrandResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BrandResponse>> Create(
        CreateBrandRequest request,
        CancellationToken cancellationToken)
    {
        var brand = await brandService.CreateAsync(request.Name, cancellationToken);
        if (brand is null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "La marca ya existe.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var response = new BrandResponse(brand.Id, brand.Name);
        return CreatedAtAction(nameof(GetById), new { id = brand.Id }, response);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        long id,
        UpdateBrandRequest request,
        CancellationToken cancellationToken)
    {
        var result = await brandService.UpdateAsync(id, request.Name, cancellationToken);
        return result switch
        {
            BrandUpdateResult.BrandNotFound => NotFound(),
            BrandUpdateResult.DuplicateName => Conflict(new ProblemDetails
            {
                Title = "La marca ya existe.",
                Status = StatusCodes.Status409Conflict
            }),
            _ => NoContent()
        };
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        var result = await brandService.DeleteAsync(id, cancellationToken);
        return result switch
        {
            BrandDeleteResult.BrandNotFound => NotFound(),
            BrandDeleteResult.HasModels => Conflict(new ProblemDetails
            {
                Title = "No se puede eliminar una marca con modelos asociados.",
                Status = StatusCodes.Status409Conflict
            }),
            _ => NoContent()
        };
    }
}
