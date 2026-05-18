namespace api;

internal static class RequestBaseUrl
{
    internal static string From(HttpRequest request) =>
        $"{request.Scheme}://{request.Host}";
}
