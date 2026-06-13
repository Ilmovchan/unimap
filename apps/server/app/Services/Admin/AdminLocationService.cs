using app.Abstractions;
using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain.Abstractions.Admin;
using domain.Entities;

namespace app.Services.Administration;

public sealed class AdminLocationService(
    IAdminLocationRepository repository,
    IUserApiCacheInvalidator cacheInvalidator) : IAdminLocationService
{
    public Task<IReadOnlyList<Location>> ListAsync(CancellationToken cancellationToken = default) =>
        repository.ListAsync(cancellationToken);

    public Task<Location?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        repository.GetByIdAsync(id, cancellationToken);

    public async Task<ServiceResult<Location>> CreateAsync(
        LocationAdminCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.LocationTypeId == Guid.Empty || string.IsNullOrWhiteSpace(command.Title))
            return ServiceResult<Location>.Fail("locationTypeId and title are required.");

        if (!await repository.LocationTypeExistsAsync(command.LocationTypeId, cancellationToken))
            return ServiceResult<Location>.Fail("locationTypeId does not exist.");

        var scheduleValidation = ValidateSchedule(command.Schedule);
        if (scheduleValidation is not null)
            return ServiceResult<Location>.Fail(scheduleValidation);

        var entity = new Location
        {
            Id = command.Id ?? Guid.NewGuid(),
            LocationTypeId = command.LocationTypeId,
            Title = command.Title.Trim(),
            Latitude = command.Latitude ?? 0,
            Longitude = command.Longitude ?? 0,
            Description = NormalizeOptionalText(command.Description),
            AddressJson = NormalizeOptionalText(command.AddressJson),
            HasShelter = command.HasShelter,
        };

        await repository.AddAsync(entity, cancellationToken);
        var schedule = BuildSchedule(entity.Id, command.Schedule);
        if (schedule is not null)
            await repository.ReplaceScheduleAsync(entity.Id, schedule, cancellationToken);

        var created = await repository.GetByIdAsync(entity.Id, cancellationToken);
        if (created is null)
            return ServiceResults.NotFound<Location>();

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<Location>.Ok(created);
    }

    public async Task<ServiceResult<Location>> UpdateAsync(
        Guid id,
        LocationAdminUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.LocationTypeId != Guid.Empty
            && !await repository.LocationTypeExistsAsync(command.LocationTypeId, cancellationToken))
        {
            return ServiceResult<Location>.Fail("locationTypeId does not exist.");
        }

        var scheduleValidation = ValidateSchedule(command.Schedule);
        if (scheduleValidation is not null)
            return ServiceResult<Location>.Fail(scheduleValidation);

        var updated = await repository.UpdateAsync(
            id,
            entity =>
            {
                if (command.LocationTypeId != Guid.Empty)
                    entity.LocationTypeId = command.LocationTypeId;
                if (!string.IsNullOrWhiteSpace(command.Title))
                    entity.Title = command.Title.Trim();
                if (command.Latitude.HasValue)
                    entity.Latitude = command.Latitude.Value;
                if (command.Longitude.HasValue)
                    entity.Longitude = command.Longitude.Value;
                entity.Description = NormalizeOptionalText(command.Description);
                entity.AddressJson = NormalizeOptionalText(command.AddressJson);
                entity.HasShelter = command.HasShelter;
            },
            cancellationToken);

        if (updated is null)
            return ServiceResults.NotFound<Location>();

        var schedule = BuildSchedule(id, command.Schedule);
        if (schedule is not null)
            await repository.ReplaceScheduleAsync(id, schedule, cancellationToken);

        var withDetails = await repository.GetByIdAsync(id, cancellationToken);
        if (withDetails is null)
            return ServiceResults.NotFound<Location>();

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<Location>.Ok(withDetails);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var deleted = await repository.DeleteByIdAsync(id, cancellationToken);
        if (!deleted)
            return ServiceResults.NotFound<bool>();

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static IReadOnlyList<Schedule>? BuildSchedule(
        Guid locationId,
        IReadOnlyList<LocationScheduleAdminCommand>? schedule)
    {
        if (schedule is null)
            return null;

        if (schedule.Count == 0)
            return [];

        return schedule
            .OrderBy(x => x.DayOfWeek)
            .Select(x => new Schedule
            {
                Id = Guid.NewGuid(),
                LocationId = locationId,
                DayOfWeek = x.DayOfWeek,
                OpeningAt = x.IsClosed ? null : x.OpeningAt,
                ClosingAt = x.IsClosed ? null : x.ClosingAt,
                IsClosed = x.IsClosed,
            })
            .ToList();
    }

    private static string? ValidateSchedule(IReadOnlyList<LocationScheduleAdminCommand>? schedule)
    {
        if (schedule is null || schedule.Count == 0)
            return null;

        if (schedule.Count != 7)
            return "schedule must contain either 0 or 7 days.";

        var days = schedule.Select(x => x.DayOfWeek).ToHashSet();
        if (days.Count != 7 || days.Any(x => x < 1 || x > 7))
            return "schedule dayOfWeek must contain each day from 1 to 7 once.";

        foreach (var day in schedule)
        {
            if (day.IsClosed)
                continue;

            if (!day.OpeningAt.HasValue || !day.ClosingAt.HasValue)
                return "schedule openingAt and closingAt are required for open days.";
        }

        return null;
    }
}
