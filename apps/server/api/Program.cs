using api.AdminEndpoints;
using api.Endpoints;
using app.Abstractions;
using app.Services;
using infrastructure.BackgroundServices;
using infrastructure.GeoService;
using infrastructure.RoutingService;
using Microsoft.EntityFrameworkCore;
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
builder.Services.AddScoped<IRoutingProvider, OpenRouteServiceRouter>();
builder.Services.AddScoped<IGeoProvider, NominatimGeoService>();
builder.Services.AddHostedService<LocationAddressJsonBackfillWorker>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
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
    }
}

app.UseCors();

app.MapLocationEndpoints();
app.MapNewsEndpoints();
app.MapNavigationEndpoints();
app.MapAdminEndpoints();

app.Run();
