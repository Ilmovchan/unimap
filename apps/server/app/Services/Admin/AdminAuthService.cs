using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain.Abstractions;
using domain.Abstractions.Admin;
using AdminEntity = domain.Entities.Admin;

namespace app.Services.Administration;

public sealed class AdminAuthService(
    IAdminAccountRepository repository,
    IAdminPasswordHasher passwordHasher) : IAdminAuthService
{
    public async Task<ServiceResult<AdminEntity>> LoginAsync(
        AdminLoginCommand command,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email) || string.IsNullOrWhiteSpace(command.Password))
            return ServiceResult<AdminEntity>.Fail("email and password are required.");

        var email = command.Email.Trim().ToLowerInvariant();
        var admin = await repository.GetByEmailAsync(email, cancellationToken);
        if (admin is null || !passwordHasher.Verify(command.Password, admin.PasswordHash))
            return ServiceResults.Unauthorized<AdminEntity>();

        await repository.RecordLoginAsync(admin.Id, DateTimeOffset.UtcNow, cancellationToken);
        return ServiceResult<AdminEntity>.Ok(admin);
    }
}
