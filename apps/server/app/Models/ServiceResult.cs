namespace app.Models;

public sealed class ServiceResult<T>
{
    public T? Value { get; init; }

    public string? Error { get; init; }

    public int StatusCode { get; init; } = 400;

    public bool IsSuccess => Error is null;

    public static ServiceResult<T> Ok(T value) => new() { Value = value, StatusCode = 200 };

    public static ServiceResult<T> Fail(string error, int statusCode = 400) =>
        new() { Error = error, StatusCode = statusCode };
}

public static class ServiceResults
{
    public static ServiceResult<T> NotFound<T>(string error = "Not found.") =>
        ServiceResult<T>.Fail(error, 404);

    public static ServiceResult<T> Conflict<T>(string error) =>
        ServiceResult<T>.Fail(error, 409);

    public static ServiceResult<T> Unauthorized<T>(string error = "Unauthorized.") =>
        ServiceResult<T>.Fail(error, 401);
}
