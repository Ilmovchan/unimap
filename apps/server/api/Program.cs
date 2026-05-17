using api.AdminEndpoints;
using api.Auth;
using api.Endpoints;
using app.Abstractions;
using app.Services;
using infrastructure;
using domain.Entities;
using infrastructure.Auth;
using infrastructure.BackgroundServices;
using Microsoft.EntityFrameworkCore;
using infrastructure.GeoService;
using infrastructure.RoutingService;
using persistence;
using persistence.Repositories;
using Unimap.Domain.Abstractions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContextFactory<UniMapDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString);
});

builder.Services.AddScoped<ILocationRepository, LocationRepository>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<INewsRepository, NewsRepository>();
builder.Services.AddScoped<INewsService, NewsService>();
builder.Services.AddScoped<IRoutingProvider, OpenRouteServiceRoutingProvider>();
builder.Services.AddScoped<IGeoProvider, NominatimGeoProvider>();
builder.Services.AddHostedService<LocationAddressJsonBackfillWorker>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddJwtCookieAuthentication(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddSwaggerGen();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using (var scope = app.Services.CreateScope())
    {
        var dbContextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<UniMapDbContext>>();
        await using var db = await dbContextFactory.CreateDbContextAsync();
        await db.Database.MigrateAsync();
        await db.EnsureAdminsTableAsync();
        await db.EnsureLocationTableAsync();
        await db.EnsureLocationPhotoTableAsync();

        if (!await db.Admins.AnyAsync())
        {
            var passwordHasher = scope.ServiceProvider.GetRequiredService<IAdminPasswordHasher>();
            db.Admins.Add(new Admin
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                Email = "admin@unimap.local",
                PasswordHash = passwordHasher.Hash("admin123"),
                Role = AdminRole.SuperAdmin,
            });
            await db.SaveChangesAsync();
        }
    }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapLocationEndpoints();
app.MapNewsEndpoints();
app.MapNavigationEndpoints();
app.MapAdminEndpoints();

app.Run();
