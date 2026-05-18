namespace app.Models.Admin;

public sealed record AdminAccountCreateCommand(
    Guid? Id,
    string? Username,
    string? Email,
    string? Password,
    string? PasswordHash,
    DateTimeOffset? LastLoginAt);

public sealed record AdminAccountUpdateCommand(
    string? Username,
    string? Email,
    string? Password,
    string? PasswordHash,
    DateTimeOffset? LastLoginAt);

public sealed record AdminLoginCommand(string Email, string Password);
