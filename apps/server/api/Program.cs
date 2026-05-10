using Unimap.Persistence;
using Microsoft.EntityFrameworkCore;
using Unimap.Api.Endpoints;
using Unimap.App.Abstractions;
using Unimap.App.Services;
using Unimap.Domain.Abstractions;
using Unimap.Persistence.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContextFactory<UniMapDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString);
});

builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();

builder.Services.AddSwaggerGen();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();



if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // using (var scope = app.Services.CreateScope())
    // {
    //     var dbContextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<UniMapDbContext>>();
    //     using var db = dbContextFactory.CreateDbContext();
    //     db.Database.EnsureCreated();
    // }
}

app.MapDepartmentEndpoints();

app.Run();