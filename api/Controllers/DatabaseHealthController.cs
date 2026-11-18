using Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("health/database")]
public sealed class DatabaseHealthController(
    AppDbContext dbContext,
    IConfiguration configuration,
    ILogger<DatabaseHealthController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Check(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("Caelestia")))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "not_configured",
                message = "Configure la cadena de conexión local antes de probar la base de datos."
            });
        }

        try
        {
            var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? Ok(new { status = "connected", provider = "PostgreSQL" })
                : StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "unavailable" });
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "No se pudo comprobar la conexión con PostgreSQL.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "unavailable" });
        }
    }
}
