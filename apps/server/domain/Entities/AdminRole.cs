namespace domain.Entities;

public enum AdminRole
{
    Admin,
    SuperAdmin,
}

public static class AdminRoleExtensions
{
    public static string ToStorage(this AdminRole role) =>
        role == AdminRole.SuperAdmin ? "super_admin" : "admin";

    public static AdminRole ParseRole(string? value) =>
        string.Equals(value?.Trim(), "super_admin", StringComparison.OrdinalIgnoreCase)
            ? AdminRole.SuperAdmin
            : AdminRole.Admin;

    public static bool IsValidRole(string? value) =>
        string.Equals(value?.Trim(), "admin", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(value?.Trim(), "super_admin", StringComparison.OrdinalIgnoreCase);
}
