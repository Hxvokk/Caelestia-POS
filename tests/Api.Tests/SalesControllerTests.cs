using System.Security.Claims;
using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Controllers;
using Api.Modules.Inventory.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Api.Tests;

public sealed class SalesControllerTests
{
    [Fact]
    public async Task RejectedPaymentReturnsUnprocessableEntityWithoutSale()
    {
        var controller = new SalesController(new FakeSaleService());
        var userId = Guid.NewGuid();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim("sub", userId.ToString())],
                    authenticationType: "test"))
            }
        };

        var result = await controller.Create(
            new CreateSaleRequest
            {
                UnitIds = [1],
                PaymentMethod = "credito",
                SimulatedCardResult = "rechazado"
            },
            CancellationToken.None);

        var response = Assert.IsType<UnprocessableEntityObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(response.Value);
        Assert.Equal(StatusCodes.Status422UnprocessableEntity, problem.Status);
        Assert.Equal("PAYMENT_REJECTED", problem.Extensions["code"]);
    }

    private sealed class FakeSaleService : ISaleService
    {
        public Task<(SaleCreateResult Result, SaleResponse? Sale, string? Error)> CreateAsync(
            Guid userId,
            CreateSaleRequest request,
            CancellationToken cancellationToken) =>
            Task.FromResult<(SaleCreateResult Result, SaleResponse? Sale, string? Error)>((
                SaleCreateResult.PaymentRejected,
                (SaleResponse?)null,
                "El pago con tarjeta fue rechazado. No se registraron ventas ni se modificó el inventario."));
    }
}
