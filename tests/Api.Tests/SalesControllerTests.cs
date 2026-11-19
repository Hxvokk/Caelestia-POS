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
        var controller = new SalesController(new FakeSaleService(), new FakeSaleHistoryService());
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

    [Theory]
    [InlineData("vendedor", true)]
    [InlineData("administrador", false)]
    public async Task HistoryScopesVendorsToTheirOwnSalesAndAllowsAdminsAllSales(
        string role,
        bool expectsUserScope)
    {
        var historyService = new FakeSaleHistoryService();
        var controller = new SalesController(new FakeSaleService(), historyService);
        var userId = Guid.NewGuid();
        controller.ControllerContext = CreateControllerContext(userId, role);

        await controller.GetHistory(CancellationToken.None);
        Assert.Equal(expectsUserScope ? userId : null, historyService.LastRequestedUserId);

        await controller.GetById(12, CancellationToken.None);
        Assert.Equal(expectsUserScope ? userId : null, historyService.LastRequestedUserId);
    }

    private static ControllerContext CreateControllerContext(Guid userId, string role) =>
        new()
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim("sub", userId.ToString()),
                        new Claim("app_role", role)
                    ],
                    authenticationType: "test",
                    nameType: "sub",
                    roleType: "app_role"))
            }
        };

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

    private sealed class FakeSaleHistoryService : ISaleHistoryService
    {
        public Guid? LastRequestedUserId { get; private set; }

        public Task<IReadOnlyList<SaleHistoryItemResponse>> GetHistoryAsync(
            Guid? userId,
            CancellationToken cancellationToken)
        {
            LastRequestedUserId = userId;
            return Task.FromResult<IReadOnlyList<SaleHistoryItemResponse>>([]);
        }

        public Task<SaleHistoryDetailResponse?> GetByIdAsync(
            long saleId,
            Guid? userId,
            CancellationToken cancellationToken)
        {
            LastRequestedUserId = userId;
            return Task.FromResult<SaleHistoryDetailResponse?>(null);
        }
    }
}
