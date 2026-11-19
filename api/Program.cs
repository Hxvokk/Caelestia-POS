using Api.Data;
using Api.Modules.Inventory.Models;
using Api.Modules.Inventory.Repositories;
using Api.Modules.Inventory.Services;
using Api.Modules.Users.Repositories;
using Api.Modules.Users.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Pega el access token de Supabase sin escribir el prefijo Bearer."
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});
var supabaseUrl = builder.Configuration["Supabase:Url"]?.TrimEnd('/');
var supabaseIssuer = string.IsNullOrWhiteSpace(supabaseUrl)
    ? "https://auth-not-configured.invalid/auth/v1"
    : $"{supabaseUrl}/auth/v1";
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = supabaseIssuer;
        options.Audience = "authenticated";
        options.RequireHttpsMetadata = true;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = supabaseIssuer,
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateIssuerSigningKey = true,
            RoleClaimType = "app_role",
            NameClaimType = "sub"
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrWhiteSpace(supabaseUrl)
                    && context.Request.Headers.ContainsKey("Authorization"))
                {
                    context.Fail("Configura Supabase:Url para habilitar la autenticación.");
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                if (string.IsNullOrWhiteSpace(supabaseUrl)
                    || !Guid.TryParse(context.Principal?.FindFirstValue("sub"), out var userId))
                {
                    context.Fail("El token no contiene un usuario Supabase válido.");
                    return;
                }

                UserProfile? profile;
                try
                {
                    var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                    profile = await dbContext.UserProfiles
                        .AsNoTracking()
                        .SingleOrDefaultAsync(user => user.Id == userId, context.HttpContext.RequestAborted);
                }
                catch (OperationCanceledException)
                {
                    throw;
                }
                catch (Exception)
                {
                    context.Fail("No se pudo comprobar el perfil del usuario.");
                    return;
                }

                if (profile is null || !profile.IsActive)
                {
                    context.Fail("El usuario no tiene un perfil activo en Caelestia POS.");
                    return;
                }

                if (context.Principal?.Identity is not ClaimsIdentity identity)
                {
                    context.Fail("No se pudo establecer la identidad del usuario.");
                    return;
                }

                foreach (var existingRole in identity.FindAll("app_role").ToArray())
                {
                    identity.RemoveClaim(existingRole);
                }

                identity.AddClaim(new Claim("app_role", profile.Role));
            }
        };
    });
builder.Services.AddAuthorization();

var connectionString = builder.Configuration.GetConnectionString("Caelestia");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString ?? string.Empty));
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<ISaleRepository, SaleRepository>();
builder.Services.AddScoped<ISaleHistoryService, SaleHistoryService>();

builder.Services.AddScoped<IBrandRepository, BrandRepository>();
builder.Services.AddScoped<IBrandService, BrandService>();
builder.Services.AddScoped<ILaptopModelRepository, LaptopModelRepository>();
builder.Services.AddScoped<ILaptopModelService, LaptopModelService>();
builder.Services.AddScoped<ILaptopUnitRepository, LaptopUnitRepository>();
builder.Services.AddScoped<ILaptopUnitService, LaptopUnitService>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddHttpClient<ISupabaseAuthAdminClient, SupabaseAuthAdminClient>();

var app = builder.Build();

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    databaseConfigured = !string.IsNullOrWhiteSpace(connectionString)
}));

app.Run();
