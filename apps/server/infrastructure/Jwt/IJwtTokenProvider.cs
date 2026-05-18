using domain.Entities;

namespace infrastructure.Jwt;

public interface IJwtTokenProvider
{
    string CreateToken(Admin admin, DateTimeOffset expiresAt);
}
