using domain.Entities;

namespace infrastructure.Jwt;

public interface IJwtTokenService
{
    string CreateToken(Admin admin, DateTimeOffset expiresAt);
}
