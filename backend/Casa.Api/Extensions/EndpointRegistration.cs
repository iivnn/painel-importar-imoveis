namespace Casa.Api.Endpoints;

public static class EndpointRegistration
{
    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapAddressEndpoints();
        endpoints.MapHealthEndpoints();
        endpoints.MapLogEndpoints();
        endpoints.MapPropertyEndpoints();
        endpoints.MapPropertyInconsistencyEndpoints();
        endpoints.MapSettingsEndpoints();

        return endpoints;
    }
}
