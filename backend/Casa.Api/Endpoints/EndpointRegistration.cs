namespace Casa.Api.Endpoints;

public static class EndpointRegistration
{
    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthEndpoints();
        endpoints.MapPropertyEndpoints();

        return endpoints;
    }
}
