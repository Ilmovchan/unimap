using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain.Abstractions;
using domain.Abstractions.Admin;
using AdminEntity = domain.Entities.Admin;
using domain.Entities;

namespace app.Services.Administration;

public sealed class AdminAccountService(
    IAdminAccountRepository repository,
    IAdminPasswordHasher passwordHasher) : IAdminAccountService
{
    public Task<IReadOnlyList<AdminEntity>> ListAsync(CancellationToken cancellationToken = default) =>
        repository.ListAsync(cancellationToken);

    public Task<AdminEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        repository.GetByIdAsync(id, cancellationToken);

    public async Task<ServiceResult<AdminEntity>> CreateAsync(
        AdminAccountCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        var plainPassword = ResolvePlainPassword(command);
        if (string.IsNullOrWhiteSpace(command.Username)
            || string.IsNullOrWhiteSpace(command.Email)
            || string.IsNullOrWhiteSpace(plainPassword))
        {
            return ServiceResult<AdminEntity>.Fail("username, email and password are required.");
        }

        var username = command.Username.Trim();
        var email = command.Email.Trim().ToLowerInvariant();

        if (await repository.UsernameExistsAsync(username, cancellationToken: cancellationToken))
            return ServiceResult<AdminEntity>.Fail("username already exists.");
        if (await repository.EmailExistsAsync(email, cancellationToken: cancellationToken))
            return ServiceResult<AdminEntity>.Fail("email already exists.");

        var entity = new AdminEntity
        {
            Id = command.Id ?? Guid.Empty,
            Username = username,
            Email = email,
            PasswordHash = passwordHasher.Hash(plainPassword),
            Role = AdminRole.Admin,
            LastLoginAt = command.LastLoginAt,
        };

        try
        {
            await repository.AddAsync(entity, cancellationToken);
        }
        catch (Exception)
        {
            return ServiceResult<AdminEntity>.Fail("username or email already exists.");
        }

        return ServiceResult<AdminEntity>.Ok(entity);
    }

    public async Task<ServiceResult<AdminEntity>> UpdateAsync(
        Guid id,
        AdminAccountUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(command.Username)
            && await repository.UsernameExistsAsync(command.Username.Trim(), id, cancellationToken))
        {
            return ServiceResult<AdminEntity>.Fail("username already exists.");
        }

        if (!string.IsNullOrWhiteSpace(command.Email)
            && await repository.EmailExistsAsync(command.Email.Trim().ToLowerInvariant(), id, cancellationToken))
        {
            return ServiceResult<AdminEntity>.Fail("email already exists.");
        }

        var plainPassword = ResolvePlainPassword(command);

        try
        {
            var updated = await repository.UpdateAsync(
                id,
                entity =>
                {
                    if (!string.IsNullOrWhiteSpace(command.Username))
                        entity.Username = command.Username.Trim();
                    if (!string.IsNullOrWhiteSpace(command.Email))
                        entity.Email = command.Email.Trim().ToLowerInvariant();
                    if (!string.IsNullOrWhiteSpace(plainPassword))
                        entity.PasswordHash = passwordHasher.Hash(plainPassword);
                    if (command.LastLoginAt.HasValue)
                        entity.LastLoginAt = command.LastLoginAt;
                },
                cancellationToken);

            return updated is null
                ? ServiceResults.NotFound<AdminEntity>()
                : ServiceResult<AdminEntity>.Ok(updated);
        }
        catch (Exception)
        {
            return ServiceResult<AdminEntity>.Fail("username or email already exists.");
        }
    }

    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        Guid currentAdminId,
        CancellationToken cancellationToken = default)
    {
        var target = await repository.GetByIdAsync(id, cancellationToken);
        if (target is null)
            return ServiceResults.NotFound<bool>();

        var error = GetDeleteError(target, currentAdminId);
        if (error is not null)
            return ServiceResult<bool>.Fail(error);

        await repository.DeleteByIdAsync(id, cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }

    private static string? GetDeleteError(AdminEntity target, Guid currentAdminId)
    {
        if (target.Id == currentAdminId)
            return "you cannot delete your own account.";
        if (target.Role == AdminRole.SuperAdmin)
            return "super_admin accounts cannot be deleted.";
        return null;
    }

    private static string? ResolvePlainPassword(AdminAccountCreateCommand command) =>
        ResolvePlainPassword(command.Password, command.PasswordHash);

    private static string? ResolvePlainPassword(AdminAccountUpdateCommand command) =>
        ResolvePlainPassword(command.Password, command.PasswordHash);

    private static string? ResolvePlainPassword(string? password, string? passwordHash)
    {
        if (!string.IsNullOrWhiteSpace(password))
            return password.Trim();
        if (!string.IsNullOrWhiteSpace(passwordHash))
            return passwordHash.Trim();
        return null;
    }
}
