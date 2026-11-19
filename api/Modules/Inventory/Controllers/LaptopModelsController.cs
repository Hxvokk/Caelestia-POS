using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Modules.Inventory.Controllers;

[ApiController]
[Route("api/laptops")]
[Authorize]
public sealed class LaptopModelsController(
    ILaptopModelService modelService,
    IModelImageService modelImageService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<LaptopModelResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LaptopModelResponse>>> GetAll(
        [FromQuery] LaptopModelQuery query,
        CancellationToken cancellationToken)
    {
        var models = await modelService.GetAllAsync(query, cancellationToken);
        return Ok(models);
    }

    [HttpGet("{id:long}")]
    [ProducesResponseType<LaptopModelResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LaptopModelResponse>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var model = await modelService.GetByIdAsync(id, cancellationToken);
        return model is null ? NotFound() : Ok(model);
    }

    [HttpPost]
    [Authorize(Roles = "administrador")]
    [ProducesResponseType<LaptopModelResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LaptopModelResponse>> Create(
        SaveLaptopModelRequest request,
        CancellationToken cancellationToken)
    {
        var (result, model) = await modelService.CreateAsync(request, cancellationToken);
        if (result == ModelWriteResult.BrandNotFound)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "La marca indicada no existe.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        if (result == ModelWriteResult.DuplicateSku)
        {
            return Conflict(new ProblemDetails
            {
                Title = "El SKU ya está registrado para esta marca.",
                Status = StatusCodes.Status409Conflict
            });
        }

        return CreatedAtAction(nameof(GetById), new { id = model!.Id }, model);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        long id,
        SaveLaptopModelRequest request,
        CancellationToken cancellationToken)
    {
        var result = await modelService.UpdateAsync(id, request, cancellationToken);
        return result switch
        {
            ModelWriteResult.ModelNotFound => NotFound(),
            ModelWriteResult.BrandNotFound => BadRequest(new ProblemDetails
            {
                Title = "La marca indicada no existe.",
                Status = StatusCodes.Status400BadRequest
            }),
            ModelWriteResult.DuplicateSku => Conflict(new ProblemDetails
            {
                Title = "El SKU ya está registrado para esta marca.",
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
        var result = await modelService.DeleteAsync(id, cancellationToken);
        return result switch
        {
            ModelDeleteResult.ModelNotFound => NotFound(),
            ModelDeleteResult.HasUnits => Conflict(new ProblemDetails
            {
                Title = "No se puede eliminar un modelo con unidades registradas.",
                Status = StatusCodes.Status409Conflict
            }),
            _ => NoContent()
        };
    }

    [HttpPost("{id:long}/image")]
    [Authorize(Roles = "administrador")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ModelImageFileValidator.MaximumFileSizeBytes + 64 * 1024)]
    [ProducesResponseType<ModelImageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ModelImageResponse>> UploadImage(
        long id,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        var (result, image) = await modelImageService.UploadAsync(id, file, cancellationToken);
        return result switch
        {
            ModelImageWriteResult.ModelNotFound => NotFound(new ProblemDetails
            {
                Title = "No se encontró el modelo indicado.",
                Status = StatusCodes.Status404NotFound
            }),
            ModelImageWriteResult.InvalidImage => BadRequest(new ProblemDetails
            {
                Title = "Selecciona una imagen JPEG, PNG o WebP de hasta 5 MB.",
                Status = StatusCodes.Status400BadRequest
            }),
            ModelImageWriteResult.StorageUnavailable => StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new ProblemDetails
                {
                    Title = "No se pudo guardar la imagen. Revisa la configuración de almacenamiento.",
                    Status = StatusCodes.Status503ServiceUnavailable
                }),
            _ => Ok(image)
        };
    }
}
