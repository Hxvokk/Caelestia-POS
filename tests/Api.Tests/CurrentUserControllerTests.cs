using System.Security.Claims;
using Api.Modules.Users.Controllers;
using Api.Modules.Users.Contracts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Api.Tests;

public sealed class CurrentUserControllerTests
{
    [Fact]
    public void GetReturnsIdentityAndRoleFromValidatedClaims()
    {
        var userId = Guid.NewGuid();
        var controller = new CurrentUserController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim("sub", userId.ToString()),
                    new Claim("app_role", "administrador")
                ], "test"))
            }
        };

        var result = controller.Get().Result as OkObjectResult;

        Assert.NotNull(result);
        var response = Assert.IsType<CurrentUserResponse>(result.Value);
        Assert.Equal(userId, response.Id);
        Assert.Equal("administrador", response.Role);
    }

    [Fact]
    public void GetRejectsIdentityWithoutSubject()
    {
        var controller = new CurrentUserController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim("app_role", "vendedor")],
                    "test"))
            }
        };

        Assert.IsType<UnauthorizedResult>(controller.Get().Result);
    }
}
