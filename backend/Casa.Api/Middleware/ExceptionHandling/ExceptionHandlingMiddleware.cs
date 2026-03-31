using System.Net;
using System.Text.Json;
using Casa.Api.Services.AppLogging;
using Microsoft.Extensions.DependencyInjection;

namespace Casa.Api.Middleware;

public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger,
    IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;
        var (statusCode, title) = MapException(exception);

        logger.LogError(
            exception,
            "Unhandled exception for {Method} {Path}. TraceId: {TraceId}",
            context.Request.Method,
            context.Request.Path,
            traceId);

        var appLogService = context.RequestServices.GetService<AppLogService>();

        if (appLogService is not null)
        {
            await appLogService.SafeLogAsync(
                () => appLogService.LogErrorAsync(
                    "ExceptionMiddleware",
                    "UnhandledException",
                    exception.Message,
                    new
                    {
                        exceptionType = exception.GetType().FullName,
                        stackTrace = exception.StackTrace,
                        requestMethod = context.Request.Method,
                        requestPath = context.Request.Path.Value,
                        queryString = context.Request.QueryString.Value
                    },
                    traceId,
                    context.Request.Path,
                    context.Request.Method,
                    cancellationToken: context.RequestAborted),
                "Falha ao persistir log de excecao no banco.");
        }

        if (context.Response.HasStarted)
        {
            logger.LogWarning(
                "The response has already started, the global exception middleware will not write the response. TraceId: {TraceId}",
                traceId);
            throw exception;
        }

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse(
            title,
            statusCode,
            traceId,
            environment.IsDevelopment() ? exception.Message : "An unexpected error occurred.",
            DateTimeOffset.UtcNow);

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }

    private static (int StatusCode, string Title) MapException(Exception exception)
    {
        return exception switch
        {
            BadHttpRequestException => ((int)HttpStatusCode.BadRequest, "Bad request"),
            UnauthorizedAccessException => ((int)HttpStatusCode.Forbidden, "Forbidden"),
            KeyNotFoundException => ((int)HttpStatusCode.NotFound, "Resource not found"),
            TimeoutException => ((int)HttpStatusCode.GatewayTimeout, "Request timeout"),
            HttpRequestException => ((int)HttpStatusCode.BadGateway, "Upstream request failed"),
            OperationCanceledException => (499, "Request canceled"),
            _ => ((int)HttpStatusCode.InternalServerError, "Unhandled exception")
        };
    }

    private sealed record ErrorResponse(
        string Title,
        int Status,
        string TraceId,
        string Detail,
        DateTimeOffset TimestampUtc);
}
