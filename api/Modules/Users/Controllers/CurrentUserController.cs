using System.Security.Claims;
using Api.Modules.Users.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Modules.Users.Controllers;

[ApiController]
[Route("api/users/me")]
[Authorize(Roles = "administrador,vendedor")]
public sealed class CurrentUserController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<CurrentUserResponse> Get()
    {
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId))
        {
            return Unauthorized();
        }

        var role = User.FindFirstValue("app_role");
        if (string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        return Ok(new CurrentUserResponse(userId, role));
    }
}
