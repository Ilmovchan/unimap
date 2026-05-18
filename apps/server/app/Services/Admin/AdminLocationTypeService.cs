using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain.Abstractions.Admin;
using domain.Entities;

namespace app.Services.Administration;

public sealed class AdminLocationTypeService(IAdminLocationTypeRepository repository) : IAdminLocationTypeService
{
    public Task<IReadOnlyList<LocationType>> ListAsync(CancellationToken cancellationToken = default) =>
        repository.ListAsync(cancellationToken);

    public Task<LocationType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        repository.GetByIdAsync(id, cancellationToken);

    public async Task<ServiceResult<LocationType>> CreateAsync(
        LocationTypeAdminCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Code) || string.IsNullOrWhiteSpace(command.TitleUk))
            return ServiceResult<LocationType>.Fail("code and titleUk are required.");

        var entity = new LocationType
        {
            Id = command.Id ?? Guid.Empty,
            Code = command.Code.Trim(),
            TitleUk = command.TitleUk.Trim(),
            MarkerKey = (command.MarkerKey ?? string.Empty).Trim(),
        };

        await repository.AddAsync(entity, cancellationToken);
        return ServiceResult<LocationType>.Ok(entity);
    }

    public async Task<ServiceResult<LocationType>> UpdateAsync(
        Guid id,
        LocationTypeAdminUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        var updated = await repository.UpdateAsync(
            id,
            entity =>
            {
                if (!string.IsNullOrWhiteSpace(command.Code))
                    entity.Code = command.Code.Trim();
                if (!string.IsNullOrWhiteSpace(command.TitleUk))
                    entity.TitleUk = command.TitleUk.Trim();
                if (command.MarkerKey is not null)
                    entity.MarkerKey = command.MarkerKey.Trim();
            },
            cancellationToken);

        return updated is null
            ? ServiceResults.NotFound<LocationType>()
            : ServiceResult<LocationType>.Ok(updated);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var deleted = await repository.TryDeleteByIdAsync(id, cancellationToken);
        if (!deleted)
        {
            var exists = await repository.GetByIdAsync(id, cancellationToken);
            if (exists is null)
                return ServiceResults.NotFound<bool>();
            return ServiceResults.Conflict<bool>("Cannot delete: locations reference this type.");
        }

        return ServiceResult<bool>.Ok(true);
    }
}
