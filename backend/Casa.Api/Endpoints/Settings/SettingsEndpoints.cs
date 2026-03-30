using Casa.Application.Settings;

namespace Casa.Api.Endpoints;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/settings", async (
            GetAppSettingsQueryService getAppSettingsQueryService,
            CancellationToken cancellationToken) =>
        {
            var settings = await getAppSettingsQueryService.ExecuteAsync(cancellationToken);
            return Results.Ok(settings);
        })
        .WithName("GetAppSettings")
        .WithOpenApi();

        endpoints.MapPut("/api/settings", async (
            UpdateAppSettingsRequest request,
            UpdateAppSettingsCommandService updateAppSettingsCommandService,
            CancellationToken cancellationToken) =>
        {
            var settings = await updateAppSettingsCommandService.ExecuteAsync(request, cancellationToken);
            return Results.Ok(settings);
        })
        .WithName("UpdateAppSettings")
        .WithOpenApi();

        return endpoints;
    }
}
