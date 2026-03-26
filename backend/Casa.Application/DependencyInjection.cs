using Casa.Application.Properties.CreateProperty;
using Casa.Application.Properties.GetProperties;
using Casa.Application.Properties.SoftDeleteProperty;
using Casa.Application.Properties.Status;
using Casa.Application.Properties.Swot;
using Casa.Application.Properties.UpdateProperty;
using Microsoft.Extensions.DependencyInjection;

namespace Casa.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<CreatePropertyCommandService>();
        services.AddScoped<GetPropertyFilterOptionsQueryService>();
        services.AddScoped<GetPropertyMapQueryService>();
        services.AddScoped<GetPropertiesQueryService>();
        services.AddScoped<GetPropertySwotAnalysisQueryService>();
        services.AddScoped<SavePropertySwotAnalysisCommandService>();
        services.AddScoped<SoftDeletePropertyCommandService>();
        services.AddScoped<UpdatePropertyStatusCommandService>();
        services.AddScoped<UpdatePropertyCommandService>();

        return services;
    }
}
