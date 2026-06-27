using api.AdminEndpoints;
using api.Auth;
using api.Endpoints;
using app;
using domain.Abstractions;
using domain.Entities;
using infrastructure;
using infrastructure.BackgroundServices;
using infrastructure.Pictures;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContextFactory<UniMapDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString);
});

builder.Services.AddPersistence();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication(builder.Configuration);
builder.Services.AddHostedService<LocationAddressJsonBackfillWorker>();
builder.Services.AddPictureStorage(builder.Configuration);
builder.Services.AddJwtCookieAuthentication(builder.Configuration);
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ??
[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddSwaggerGen();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseForwardedHeaders();

var picturesRoot = Path.Combine(
    app.Environment.ContentRootPath,
    builder.Configuration.GetValue("Pictures:LocalRootPath", "pictures") ?? "pictures");
Directory.CreateDirectory(picturesRoot);

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

await EnsureDefaultSuperAdminAsync(app.Services);

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapPictureEndpoints();
app.MapLocationEndpoints();
app.MapNewsEndpoints();
app.MapNavigationEndpoints();
app.MapMapEndpoints();
app.MapAdminEndpoints();

app.Run();

static async Task EnsureDefaultSuperAdminAsync(IServiceProvider services)
{
    const string username = "admin";
    const string email = "admin@admin.com";
    const string password = "admin";

    using var scope = services.CreateScope();
    var dbContextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<UniMapDbContext>>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IAdminPasswordHasher>();

    await using var db = await dbContextFactory.CreateDbContextAsync();
    await db.Database.MigrateAsync();

    var admin = await db.Admins.FirstOrDefaultAsync(x => x.Email == email)
        ?? await db.Admins.FirstOrDefaultAsync(x => x.Username == username);

    if (admin is null)
    {
        db.Admins.Add(new Admin
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            PasswordHash = passwordHasher.Hash(password),
            Role = AdminRole.SuperAdmin,
        });
    }
    else
    {
        if (string.IsNullOrWhiteSpace(admin.Username))
            admin.Username = username;
        admin.Email = email;
        admin.PasswordHash = passwordHasher.Hash(password);
        admin.Role = AdminRole.SuperAdmin;
    }

    await db.SaveChangesAsync();
}
