namespace Casa.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/health", () =>
        {
            return Results.Ok(new
            {
                status = "ok",
                app = "Casa.Api",
                message = "API local pronta para cadastro de imoveis."
            });
        })
        .WithName("GetHealth")
        .WithOpenApi();

        return endpoints;
    }
}
