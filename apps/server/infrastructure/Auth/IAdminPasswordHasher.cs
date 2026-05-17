namespace infrastructure.Auth;

public interface IAdminPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string passwordHash);
}
