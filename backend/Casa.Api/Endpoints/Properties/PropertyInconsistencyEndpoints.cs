using Casa.Api.Hubs;
using Casa.Api.Services.AppLogging;
using Casa.Application.Properties.Inconsistencies;

namespace Casa.Api.Endpoints;

public static class PropertyInconsistencyEndpoints
{
    public static IEndpointRouteBuilder MapPropertyInconsistencyEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/properties/inconsistencies", async (
            GetPropertyInconsistenciesQueryService getPropertyInconsistenciesQueryService,
            CancellationToken cancellationToken) =>
        {
            var response = await getPropertyInconsistenciesQueryService.ExecuteAsync(cancellationToken);

            return Results.Ok(response);
        })
        .WithName("GetPropertyInconsistencies")
        .WithOpenApi();

        endpoints.MapGet("/api/properties/inconsistencies/summary", async (
            GetPropertyInconsistenciesQueryService getPropertyInconsistenciesQueryService,
            CancellationToken cancellationToken) =>
        {
            var response = await getPropertyInconsistenciesQueryService.ExecuteSummaryAsync(cancellationToken);

            return Results.Ok(response);
        })
        .WithName("GetPropertyInconsistenciesSummary")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/inconsistencies/{inconsistencyId}/dismiss", async (
            string inconsistencyId,
            HttpContext httpContext,
            AppLogService appLogService,
            DismissPropertyInconsistencyCommandService dismissPropertyInconsistencyCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            await dismissPropertyInconsistencyCommandService.DismissAsync(inconsistencyId, cancellationToken);
            await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            await appLogService.LogInfoAsync(
                "Inconsistencies",
                "InconsistencyDismissed",
                "Inconsistencia ignorada pelo usuario.",
                new { inconsistencyId },
                httpContext.TraceIdentifier,
                httpContext.Request.Path,
                httpContext.Request.Method,
                "PropertyInconsistency",
                inconsistencyId,
                cancellationToken);

            return Results.NoContent();
        })
        .WithName("DismissPropertyInconsistency")
        .WithOpenApi();

        endpoints.MapHub<InconsistencyHub>("/hubs/inconsistencies");

        return endpoints;
    }
}
