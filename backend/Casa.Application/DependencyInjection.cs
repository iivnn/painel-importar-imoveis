using Casa.Application.Properties.CreateProperty;
using Casa.Application.Properties.GetProperties;
using Casa.Application.Properties.SoftDeleteProperty;
using Casa.Application.Properties.UpdateProperty;
using Microsoft.Extensions.DependencyInjection;

namespace Casa.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<CreatePropertyCommandService>();
        services.AddScoped<GetPropertiesQueryService>();
        services.AddScoped<SoftDeletePropertyCommandService>();
        services.AddScoped<UpdatePropertyCommandService>();

        return services;
    }
}
