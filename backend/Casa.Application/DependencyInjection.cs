using Casa.Application.Properties.CreateProperty;
using Casa.Application.Properties.Details;
using Casa.Application.Properties.Favorite;
using Casa.Application.Properties.Favorites;
using Casa.Application.Properties.GetProperties;
using Casa.Application.Properties.Inconsistencies;
using Casa.Application.Properties.SoftDeleteProperty;
using Casa.Application.Properties.Status;
using Casa.Application.Properties.Swot;
using Casa.Application.Properties.UpdateProperty;
using Casa.Application.Settings;
using Microsoft.Extensions.DependencyInjection;

namespace Casa.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<CreatePropertyCommandService>();
        services.AddScoped<DeletePropertyAttachmentCommandService>();
        services.AddScoped<GetAppSettingsQueryService>();
        services.AddScoped<GetFavoritePropertiesQueryService>();
        services.AddScoped<GetPropertyDetailsQueryService>();
        services.AddScoped<UpdatePropertyFavoriteCommandService>();
        services.AddScoped<GetPropertyFilterOptionsQueryService>();
        services.AddScoped<GetPropertyInconsistenciesQueryService>();
        services.AddScoped<DismissPropertyInconsistencyCommandService>();
        services.AddScoped<GetPropertyMapQueryService>();
        services.AddScoped<GetPropertiesQueryService>();
        services.AddScoped<GetPropertySwotAnalysisQueryService>();
        services.AddScoped<SavePropertyAttachmentsCommandService>();
        services.AddScoped<SavePropertySwotAnalysisCommandService>();
        services.AddScoped<SoftDeletePropertyCommandService>();
        services.AddScoped<UpdateAppSettingsCommandService>();
        services.AddScoped<UpdatePropertyNotesCommandService>();
        services.AddScoped<UpdatePropertyStatusCommandService>();
        services.AddScoped<UpdatePropertyCommandService>();

        return services;
    }
}
