using Microsoft.AspNetCore.Http;

namespace infrastructure.Map;

public interface IMapStyleService
{
    Task<string> GetStyleJsonAsync(HttpRequest request, CancellationToken cancellationToken = default);
}
