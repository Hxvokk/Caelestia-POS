using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Brand> Brands => Set<Brand>();

    public DbSet<LaptopModel> LaptopModels => Set<LaptopModel>();

    public DbSet<LaptopUnit> LaptopUnits => Set<LaptopUnit>();

    public DbSet<SaleDetail> SaleDetails => Set<SaleDetail>();

    public DbSet<Sale> Sales => Set<Sale>();

    public DbSet<SalePayment> SalePayments => Set<SalePayment>();

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Brand>(entity =>
        {
            entity.ToTable("marcas");
            entity.HasKey(brand => brand.Id);
            entity.Property(brand => brand.Id).HasColumnName("id").UseIdentityAlwaysColumn();
            entity.Property(brand => brand.Name)
                .HasColumnName("nombre")
                .HasMaxLength(80)
                .IsRequired();
            entity.HasIndex(brand => brand.Name).IsUnique();
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.ToTable("usuarios");
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Id).HasColumnName("id");
            entity.Property(user => user.Name).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(user => user.Email).HasColumnName("correo").HasMaxLength(150).IsRequired();
            entity.Property(user => user.Role).HasColumnName("rol").HasMaxLength(20).IsRequired();
            entity.Property(user => user.IsActive).HasColumnName("activo").IsRequired();
            entity.HasIndex(user => user.Email).IsUnique();
        });

        modelBuilder.Entity<LaptopModel>(entity =>
        {
            entity.ToTable("modelos_laptop", table =>
            {
                table.HasCheckConstraint("ck_modelos_laptop_almacenamiento_positivo", "almacenamiento_gb > 0");
                table.HasCheckConstraint("ck_modelos_laptop_precio_positivo", "precio > 0");
                table.HasCheckConstraint("ck_modelos_laptop_nucleos_positivos", "nucleos_cpu IS NULL OR nucleos_cpu > 0");
                table.HasCheckConstraint("ck_modelos_laptop_hilos_positivos", "hilos_cpu IS NULL OR hilos_cpu > 0");
                table.HasCheckConstraint("ck_modelos_laptop_ram_positiva", "ram_gb IS NULL OR ram_gb > 0");
                table.HasCheckConstraint("ck_modelos_laptop_vram_positiva", "gpu_vram_gb IS NULL OR gpu_vram_gb > 0");
                table.HasCheckConstraint(
                    "ck_modelos_laptop_estado_permiso_imagen",
                    "estado_permiso_imagen IN ('no_confirmado', 'permiso_confirmado', 'licencia_abierta')");
            });

            entity.HasKey(model => model.Id);
            entity.Property(model => model.Id).HasColumnName("id").UseIdentityAlwaysColumn();
            entity.Property(model => model.BrandId).HasColumnName("marca_id").IsRequired();
            entity.Property(model => model.Sku).HasColumnName("codigo_sku").HasMaxLength(120);
            entity.Property(model => model.Name).HasColumnName("nombre").HasMaxLength(120).IsRequired();
            entity.Property(model => model.ProcessorOrChip).HasColumnName("procesador_o_chip").HasMaxLength(150).IsRequired();
            entity.Property(model => model.CpuCores).HasColumnName("nucleos_cpu");
            entity.Property(model => model.CpuThreads).HasColumnName("hilos_cpu");
            entity.Property(model => model.UnifiedMemoryGb).HasColumnName("memoria_unificada_gb");
            entity.Property(model => model.RamGb).HasColumnName("ram_gb");
            entity.Property(model => model.StorageGb).HasColumnName("almacenamiento_gb").IsRequired();
            entity.Property(model => model.StorageType).HasColumnName("tipo_almacenamiento").HasMaxLength(20).IsRequired();
            entity.Property(model => model.Gpu).HasColumnName("gpu").HasMaxLength(150);
            entity.Property(model => model.GpuType).HasColumnName("tipo_gpu").HasMaxLength(20);
            entity.Property(model => model.GpuVramGb).HasColumnName("gpu_vram_gb").HasPrecision(6, 2);
            entity.Property(model => model.CpuLevel).HasColumnName("nivel_cpu").HasMaxLength(20);
            entity.Property(model => model.GpuLevel).HasColumnName("nivel_gpu").HasMaxLength(20);
            entity.Property(model => model.Price).HasColumnName("precio").HasPrecision(12, 2).IsRequired();
            entity.Property(model => model.PriceSourceUrl).HasColumnName("fuente_precio");
            entity.Property(model => model.PriceCheckedOn).HasColumnName("fecha_consulta_precio");
            entity.Property(model => model.SpecificationsSource).HasColumnName("fuente_especificaciones");
            entity.Property(model => model.ImageUrl).HasColumnName("imagen_url");
            entity.Property(model => model.ImageSourceUrl).HasColumnName("fuente_imagen_url");
            entity.Property(model => model.ImageTermsUrl).HasColumnName("terminos_imagen_url");
            entity.Property(model => model.ImageRightsStatus)
                .HasColumnName("estado_permiso_imagen")
                .HasMaxLength(30)
                .HasDefaultValue("no_confirmado")
                .IsRequired();
            entity.Property(model => model.CreatedAt).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasIndex(model => new { model.BrandId, model.Sku })
                .IsUnique()
                .HasFilter("codigo_sku IS NOT NULL");

            entity.HasOne(model => model.Brand)
                .WithMany(brand => brand.Models)
                .HasForeignKey(model => model.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LaptopUnit>(entity =>
        {
            entity.ToTable("unidades_laptop", table =>
                table.HasCheckConstraint("ck_unidades_laptop_estado", "estado IN ('disponible', 'vendida')"));

            entity.HasKey(unit => unit.Id);
            entity.Property(unit => unit.Id).HasColumnName("id").UseIdentityAlwaysColumn();
            entity.Property(unit => unit.LaptopModelId).HasColumnName("modelo_id").IsRequired();
            entity.Property(unit => unit.SerialNumber).HasColumnName("numero_serie").HasMaxLength(100).IsRequired();
            entity.Property(unit => unit.Status).HasColumnName("estado").HasMaxLength(20).IsRequired();
            entity.Property(unit => unit.RegisteredAt).HasColumnName("fecha_registro").HasDefaultValueSql("now()");
            entity.HasIndex(unit => unit.SerialNumber).IsUnique();

            entity.HasOne(unit => unit.LaptopModel)
                .WithMany(model => model.Units)
                .HasForeignKey(unit => unit.LaptopModelId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SaleDetail>(entity =>
        {
            entity.ToTable("detalles_venta", table =>
                table.HasCheckConstraint("ck_detalles_venta_precio_unitario", "precio_unitario > 0"));
            entity.HasKey(detail => detail.Id);
            entity.Property(detail => detail.Id).HasColumnName("id").UseIdentityAlwaysColumn();
            entity.Property(detail => detail.SaleId).HasColumnName("venta_id").IsRequired();
            entity.Property(detail => detail.LaptopUnitId).HasColumnName("unidad_id");
            entity.Property(detail => detail.UnitPrice).HasColumnName("precio_unitario").HasPrecision(12, 2).IsRequired();
            entity.HasIndex(detail => detail.LaptopUnitId).IsUnique();
            entity.HasIndex(detail => detail.SaleId);

            entity.HasOne(detail => detail.Sale)
                .WithMany(sale => sale.Details)
                .HasForeignKey(detail => detail.SaleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(detail => detail.LaptopUnit)
                .WithOne()
                .HasForeignKey<SaleDetail>(detail => detail.LaptopUnitId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Sale>(entity =>
        {
            entity.ToTable("ventas", table =>
            {
                table.HasCheckConstraint("ck_ventas_total", "total > 0");
                table.HasCheckConstraint("ck_ventas_estado", "estado = 'completada'");
            });
            entity.HasKey(sale => sale.Id);
            entity.Property(sale => sale.Id).HasColumnName("id").UseIdentityAlwaysColumn();
            entity.Property(sale => sale.UserId).HasColumnName("usuario_id").IsRequired();
            entity.Property(sale => sale.Date).HasColumnName("fecha").HasDefaultValueSql("now()");
            entity.Property(sale => sale.Total).HasColumnName("total").HasPrecision(12, 2).IsRequired();
            entity.Property(sale => sale.Status).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("completada").IsRequired();
            entity.HasIndex(sale => new { sale.UserId, sale.Date });

            entity.HasOne<UserProfile>()
                .WithMany()
                .HasForeignKey(sale => sale.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SalePayment>(entity =>
        {
            entity.ToTable("pagos", table =>
            {
                table.HasCheckConstraint("ck_pagos_metodo", "metodo IN ('efectivo', 'debito', 'credito')");
                table.HasCheckConstraint("ck_pagos_monto", "monto > 0");
                table.HasCheckConstraint("ck_pagos_cambio", "cambio >= 0");
                table.HasCheckConstraint("ck_pagos_estado", "estado = 'aprobado'");
                table.HasCheckConstraint(
                    "ck_pagos_datos_efectivo",
                    "(metodo = 'efectivo' AND monto_recibido IS NOT NULL AND monto_recibido >= monto AND cambio = monto_recibido - monto) OR (metodo IN ('debito', 'credito') AND monto_recibido IS NULL AND cambio = 0)");
            });
            entity.HasKey(payment => payment.Id);
            entity.Property(payment => payment.Id).HasColumnName("id").UseIdentityAlwaysColumn();
            entity.Property(payment => payment.SaleId).HasColumnName("venta_id").IsRequired();
            entity.Property(payment => payment.Method).HasColumnName("metodo").HasMaxLength(20).IsRequired();
            entity.Property(payment => payment.Amount).HasColumnName("monto").HasPrecision(12, 2).IsRequired();
            entity.Property(payment => payment.AmountReceived).HasColumnName("monto_recibido").HasPrecision(12, 2);
            entity.Property(payment => payment.Change).HasColumnName("cambio").HasPrecision(12, 2).HasDefaultValue(0).IsRequired();
            entity.Property(payment => payment.Status).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("aprobado").IsRequired();
            entity.Property(payment => payment.Reference).HasColumnName("referencia").HasMaxLength(60);
            entity.Property(payment => payment.IsSimulated).HasColumnName("es_simulado").HasDefaultValue(true).IsRequired();
            entity.Property(payment => payment.Date).HasColumnName("fecha").HasDefaultValueSql("now()");
            entity.HasIndex(payment => payment.SaleId).IsUnique();

            entity.HasOne(payment => payment.Sale)
                .WithOne(sale => sale.Payment)
                .HasForeignKey<SalePayment>(payment => payment.SaleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
