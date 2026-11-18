namespace Api.Modules.Inventory.Services;

public sealed record SalePaymentCalculation(
    decimal? AmountReceived,
    decimal Change);

public static class SalePaymentRules
{
    public static bool TryCalculate(
        string method,
        decimal total,
        decimal? amountReceived,
        out SalePaymentCalculation calculation,
        out string error)
    {
        calculation = new SalePaymentCalculation(null, 0);
        error = string.Empty;

        if (total <= 0)
        {
            error = "El total de la venta debe ser positivo.";
            return false;
        }

        if (total > 9_999_999_999.99m)
        {
            error = "El total excede el límite permitido para una venta.";
            return false;
        }

        if (method == "efectivo")
        {
            if (!amountReceived.HasValue || amountReceived.Value < total)
            {
                error = "El efectivo recibido debe cubrir el total.";
                return false;
            }

            calculation = new SalePaymentCalculation(
                amountReceived.Value,
                amountReceived.Value - total);
            return true;
        }

        if (method is "debito" or "credito")
        {
            if (amountReceived.HasValue)
            {
                error = "No se debe enviar efectivo recibido para pagos con tarjeta.";
                return false;
            }

            calculation = new SalePaymentCalculation(null, 0);
            return true;
        }

        error = "El método de pago no es válido.";
        return false;
    }
}
