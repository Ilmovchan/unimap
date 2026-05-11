// using Microsoft.Extensions.DependencyInjection;
// using Microsoft.Extensions.Hosting;
// using Microsoft.Extensions.Logging;
//
// namespace infrastructure.BackgroundServices;
//
// public class MaintenanceWorkerService(
//     ILogger<MaintenanceWorkerService> logger,
//     IServiceScopeFactory serviceScopeFactory)
//     : BackgroundService
// {
//     protected override async Task ExecuteAsync(CancellationToken cancellationToken)
//     {
//         logger.LogInformation("Worker service is running.");
//
//         while (!cancellationToken.IsCancellationRequested)
//         {
//             logger.LogInformation(
//                 "MaintenanceWorker doing work at: {time}",
//                 DateTime.Now
//             );
//
//             // await RefreshAddresses(cancellationToken);
//             // await CleanUpPullUps(cancellationToken);
//
//             await Task.Delay(TimeSpan.FromHours(12), cancellationToken);
//         }
//
//         logger.LogInformation("Worker service is stopping.");
//     }
// }