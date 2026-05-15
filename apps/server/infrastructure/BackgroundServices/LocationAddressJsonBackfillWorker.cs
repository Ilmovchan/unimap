using infrastructure.GeoService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using persistence;

namespace infrastructure.BackgroundServices;

/// <summary>
/// Для локацій без <c>address_json</c> викликає <see cref="IGeoProvider.GeoReverse"/> і зберігає JSON у БД.
/// Повний прохід — раз на 24 години.
/// </summary>
public sealed class LocationAddressJsonBackfillWorker(
    ILogger<LocationAddressJsonBackfillWorker> logger,
    IServiceScopeFactory scopeFactory)
    : BackgroundService
{
    private static readonly TimeSpan RunInterval = TimeSpan.FromHours(24);
    private static readonly TimeSpan NominatimPause = TimeSpan.FromMilliseconds(1100);
    private const int BatchSize = 50;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunBackfillCycleAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "AddressJson backfill cycle failed");
            }

            await Task.Delay(RunInterval, stoppingToken);
        }
    }

    private async Task RunBackfillCycleAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AddressJson backfill cycle started");

        var processed = 0;

        while (!stoppingToken.IsCancellationRequested)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var factory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<UniMapDbContext>>();
            var geo = scope.ServiceProvider.GetRequiredService<IGeoProvider>();
            await using var db = await factory.CreateDbContextAsync(stoppingToken);

            // jsonb не можна порівнювати з '' — PostgreSQL: invalid input syntax for type json (22P02).
            var batch = await db.Locations
                .Where(l => l.AddressJson == null)
                .OrderBy(l => l.Id)
                .Take(BatchSize)
                .ToListAsync(stoppingToken);

            if (batch.Count == 0)
                break;

            foreach (var loc in batch)
            {
                if (stoppingToken.IsCancellationRequested)
                    return;

                try
                {
                    var json = await geo.GeoReverse(loc.Latitude, loc.Longitude);
                    if (string.IsNullOrWhiteSpace(json))
                        continue;

                    loc.AddressJson = json;
                    await db.SaveChangesAsync(stoppingToken);
                    processed++;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "AddressJson backfill {Id}", loc.Id);
                }

                await Task.Delay(NominatimPause, stoppingToken);
            }
        }

        logger.LogInformation(
            "AddressJson backfill cycle finished, updated {Count} location(s)",
            processed);
    }
}
