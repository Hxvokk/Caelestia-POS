using Api.Data;
using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests;

public sealed class AppDbContextModelTests
{
    [Fact]
    public void SaleEntitiesMapToExistingSupabaseTablesAndColumns()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=caelestia_test;Username=test;Password=test")
            .Options;

        using var dbContext = new AppDbContext(options);
        var sale = dbContext.Model.FindEntityType(typeof(Sale))!;
        var detail = dbContext.Model.FindEntityType(typeof(SaleDetail))!;
        var payment = dbContext.Model.FindEntityType(typeof(SalePayment))!;
        var user = dbContext.Model.FindEntityType(typeof(UserProfile))!;

        Assert.Equal("ventas", sale.GetTableName());
        Assert.Equal("usuario_id", sale.FindProperty(nameof(Sale.UserId))!.GetColumnName());
        Assert.Equal("detalles_venta", detail.GetTableName());
        Assert.Equal("precio_unitario", detail.FindProperty(nameof(SaleDetail.UnitPrice))!.GetColumnName());
        Assert.Equal("pagos", payment.GetTableName());
        Assert.Equal("es_simulado", payment.FindProperty(nameof(SalePayment.IsSimulated))!.GetColumnName());
        Assert.Equal("usuarios", user.GetTableName());
        Assert.Equal("nombre", user.FindProperty(nameof(UserProfile.Name))!.GetColumnName());
        Assert.Equal("correo", user.FindProperty(nameof(UserProfile.Email))!.GetColumnName());
        Assert.Equal("activo", user.FindProperty(nameof(UserProfile.IsActive))!.GetColumnName());
    }
}
