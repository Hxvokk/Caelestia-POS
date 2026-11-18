using Api.Modules.Inventory.Services;
using Xunit;

namespace Api.Tests;

public sealed class SalePaymentRulesTests
{
    [Fact]
    public void CashPaymentCalculatesChange()
    {
        var valid = SalePaymentRules.TryCalculate(
            "efectivo",
            1250.50m,
            1500m,
            out var calculation,
            out var error);

        Assert.True(valid);
        Assert.Empty(error);
        Assert.Equal(1500m, calculation.AmountReceived);
        Assert.Equal(249.50m, calculation.Change);
    }

    [Fact]
    public void CashPaymentRejectsMissingAmount()
    {
        var valid = SalePaymentRules.TryCalculate(
            "efectivo",
            100m,
            null,
            out _,
            out var error);

        Assert.False(valid);
        Assert.Equal("El efectivo recibido debe cubrir el total.", error);
    }

    [Fact]
    public void CashPaymentRejectsInsufficientAmount()
    {
        var valid = SalePaymentRules.TryCalculate(
            "efectivo",
            100m,
            99.99m,
            out _,
            out var error);

        Assert.False(valid);
        Assert.Equal("El efectivo recibido debe cubrir el total.", error);
    }

    [Theory]
    [InlineData("debito")]
    [InlineData("credito")]
    public void CardPaymentsDoNotRequireCash(string method)
    {
        var valid = SalePaymentRules.TryCalculate(
            method,
            1250.50m,
            null,
            out var calculation,
            out var error);

        Assert.True(valid);
        Assert.Empty(error);
        Assert.Null(calculation.AmountReceived);
        Assert.Equal(0m, calculation.Change);
    }

    [Theory]
    [InlineData("debito")]
    [InlineData("credito")]
    public void CardPaymentsRejectCashReceived(string method)
    {
        var valid = SalePaymentRules.TryCalculate(
            method,
            100m,
            100m,
            out _,
            out var error);

        Assert.False(valid);
        Assert.Equal("No se debe enviar efectivo recibido para pagos con tarjeta.", error);
    }

    [Fact]
    public void RejectsUnknownMethodAndInvalidTotals()
    {
        Assert.False(SalePaymentRules.TryCalculate("transferencia", 100m, null, out _, out _));
        Assert.False(SalePaymentRules.TryCalculate("efectivo", 0m, 10m, out _, out _));
        Assert.False(SalePaymentRules.TryCalculate(
            "efectivo",
            10_000_000_000m,
            10_000_000_000m,
            out _,
            out _));
    }
}
