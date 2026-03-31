using Casa.Application.Settings;
using Casa.Api.Services.AppLogging;

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
            HttpContext httpContext,
            AppLogService appLogService,
            UpdateAppSettingsCommandService updateAppSettingsCommandService,
            CancellationToken cancellationToken) =>
        {
            var settings = await updateAppSettingsCommandService.ExecuteAsync(request, cancellationToken);
            await appLogService.LogInfoAsync(
                "Settings",
                "SettingsUpdated",
                "Configuracoes do sistema atualizadas.",
                new
                {
                    request.ListingsPageSize,
                    request.FavoritesPageSize,
                    request.FavoritesSortBy,
                    request.MapInitialLatitude,
                    request.MapInitialLongitude,
                    request.MapInitialZoom
                },
                httpContext.TraceIdentifier,
                httpContext.Request.Path,
                httpContext.Request.Method,
                cancellationToken: cancellationToken);
            return Results.Ok(settings);
        })
        .WithName("UpdateAppSettings")
        .WithOpenApi();

        return endpoints;
    }
}
