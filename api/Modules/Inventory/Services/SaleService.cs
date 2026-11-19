using System.Data;
using Api.Data;
using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Api.Modules.Inventory.Services;

public sealed class SaleService(AppDbContext dbContext) : ISaleService
{
    public async Task<(SaleCreateResult Result, SaleResponse? Sale, string? Error)> CreateAsync(
        Guid userId,
        CreateSaleRequest request,
        CancellationToken cancellationToken)
    {
        if (request.UnitIds is null)
        {
            return (SaleCreateResult.InvalidUnits, null, "Indica las unidades de la venta.");
        }

        var unitIds = request.UnitIds.Distinct().Order().ToArray();
        if (unitIds.Length == 0 || unitIds.Length != request.UnitIds.Count || unitIds.Any(id => id <= 0))
        {
            return (SaleCreateResult.InvalidUnits, null, "La venta requiere unidades válidas y sin duplicados.");
        }

        if (!SalePaymentRules.TryEvaluateCardPayment(
                request.PaymentMethod,
                request.SimulatedCardResult,
                out var isPaymentApproved,
                out var paymentSelectionError))
        {
            return (SaleCreateResult.InvalidPayment, null, paymentSelectionError);
        }

        if (!isPaymentApproved)
        {
            return (
                SaleCreateResult.PaymentRejected,
                null,
                "El pago con tarjeta fue rechazado. No se registraron ventas ni se modificó el inventario.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var units = await dbContext.LaptopUnits
                .FromSqlInterpolated($"""
                    SELECT *
                    FROM public.unidades_laptop
                    WHERE id = ANY ({unitIds})
                    ORDER BY id
                    FOR UPDATE
                    """)
                .ToListAsync(cancellationToken);

            if (units.Count != unitIds.Length)
            {
                await transaction.RollbackAsync(cancellationToken);
                return (SaleCreateResult.UnitNotFound, null, "Una o más unidades no existen.");
            }

            if (units.Any(unit => unit.Status != "disponible"))
            {
                await transaction.RollbackAsync(cancellationToken);
                return (SaleCreateResult.UnitUnavailable, null, "Una o más unidades ya no están disponibles.");
            }

            var modelIds = units.Select(unit => unit.LaptopModelId).Distinct().ToArray();
            var models = await dbContext.LaptopModels
                .AsNoTracking()
                .Include(model => model.Brand)
                .Where(model => modelIds.Contains(model.Id))
                .ToDictionaryAsync(model => model.Id, cancellationToken);

            if (units.Any(unit => !models.ContainsKey(unit.LaptopModelId)))
            {
                await transaction.RollbackAsync(cancellationToken);
                return (SaleCreateResult.Conflict, null, "No se pudo resolver el modelo de una unidad.");
            }

            var total = decimal.Round(
                units.Sum(unit => models[unit.LaptopModelId].Price),
                2,
                MidpointRounding.AwayFromZero);

            if (!SalePaymentRules.TryCalculate(
                    request.PaymentMethod,
                    total,
                    request.AmountReceived,
                    out var paymentCalculation,
                    out var paymentError))
            {
                await transaction.RollbackAsync(cancellationToken);
                return (SaleCreateResult.InvalidPayment, null, paymentError);
            }

            foreach (var unit in units)
            {
                unit.Status = "vendida";
            }

            var sale = new Sale
            {
                UserId = userId,
                Date = DateTimeOffset.UtcNow,
                Total = total,
                Status = "completada",
            };

            foreach (var unit in units)
            {
                var model = models[unit.LaptopModelId];
                sale.Details.Add(new SaleDetail
                {
                    Sale = sale,
                    LaptopUnitId = unit.Id,
                    LaptopUnit = unit,
                    UnitPrice = model.Price
                });
            }

            sale.Payment = new SalePayment
            {
                Sale = sale,
                Method = request.PaymentMethod,
                Amount = total,
                AmountReceived = paymentCalculation.AmountReceived,
                Change = paymentCalculation.Change,
                Status = "aprobado",
                Reference = $"SIM-{Guid.NewGuid():N}",
                IsSimulated = true,
                Date = DateTimeOffset.UtcNow
            };

            dbContext.Sales.Add(sale);
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var response = new SaleResponse(
                sale.Id,
                sale.UserId,
                sale.Date,
                sale.Total,
                sale.Status,
                sale.Payment.Method,
                sale.Payment.AmountReceived,
                sale.Payment.Change,
                sale.Payment.IsSimulated,
                sale.Details.Select(detail =>
                {
                    var unit = detail.LaptopUnit;
                    var model = models[unit.LaptopModelId];
                    return new SaleLineResponse(
                        unit.Id,
                        unit.SerialNumber,
                        model.Brand.Name,
                        model.Name,
                        detail.UnitPrice);
                }).ToArray());

            return (SaleCreateResult.Success, response, null);
        }
        catch (Exception exception) when (IsConcurrencyConflict(exception))
        {
            await transaction.RollbackAsync(cancellationToken);
            return (SaleCreateResult.Conflict, null, "La unidad cambió mientras se procesaba la venta. Actualiza el inventario e intenta de nuevo.");
        }
    }

    private static bool IsConcurrencyConflict(Exception exception)
    {
        var current = exception;
        while (current is not null)
        {
            if (current is PostgresException
                {
                    SqlState: PostgresErrorCodes.SerializationFailure
                        or PostgresErrorCodes.DeadlockDetected
                        or PostgresErrorCodes.UniqueViolation
                })
            {
                return true;
            }

            current = current.InnerException!;
        }

        return false;
    }
}
