using app.Models;

namespace api;

internal static class ServiceResultExtensions
{
    internal static IResult ToHttpResult<T>(this ServiceResult<T> result, Func<T, IResult> onSuccess) =>
        result.IsSuccess
            ? onSuccess(result.Value!)
            : Results.Json(new { error = result.Error }, statusCode: result.StatusCode);

    internal static IResult ToHttpResult(this ServiceResult<bool> result, Func<IResult> onSuccess) =>
        result.IsSuccess
            ? onSuccess()
            : Results.Json(new { error = result.Error }, statusCode: result.StatusCode);
}
