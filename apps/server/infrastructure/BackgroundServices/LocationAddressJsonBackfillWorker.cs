using infrastructure.GeoService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using persistence;

namespace infrastructure.BackgroundServices;

/// <summary>
/// Для локацій без <c>address_json</c> викликає <see cref="IGeoProvider.GeoReverse"/> і зберігає JSON у БД.
/// </summary>
public sealed class LocationAddressJsonBackfillWorker(
    ILogger<LocationAddressJsonBackfillWorker> logger,
    IServiceScopeFactory scopeFactory)
    : BackgroundService
{
    private static readonly TimeSpan IdleWhenNothingToDo = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan NominatimPause = TimeSpan.FromMilliseconds(1100);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var factory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<UniMapDbContext>>();
                var geo = scope.ServiceProvider.GetRequiredService<IGeoProvider>();
                await using var db = await factory.CreateDbContextAsync(stoppingToken);

                // jsonb не можна порівнювати з '' — PostgreSQL: invalid input syntax for type json (22P02).
                var batch = await db.Locations
                    .Where(l => l.AddressJson == null)
                    .OrderBy(l => l.Id)
                    .Take(50)
                    .ToListAsync(stoppingToken);

                if (batch.Count == 0)
                {
                    await Task.Delay(IdleWhenNothingToDo, stoppingToken);
                    continue;
                }

                foreach (var loc in batch)
                {
                    if (stoppingToken.IsCancellationRequested)
                        break;

                    try
                    {
                        var json = await geo.GeoReverse(loc.Latitude, loc.Longitude);
                        if (string.IsNullOrWhiteSpace(json))
                            continue;

                        loc.AddressJson = json;
                        await db.SaveChangesAsync(stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "AddressJson backfill {Id}", loc.Id);
                    }

                    await Task.Delay(NominatimPause, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "AddressJson backfill");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }
}
