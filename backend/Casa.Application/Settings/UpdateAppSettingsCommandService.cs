using Casa.Application.Abstractions;

namespace Casa.Application.Settings;

public class UpdateAppSettingsCommandService(IAppSettingsRepository appSettingsRepository)
{
    public async Task<AppSettingsResponse> ExecuteAsync(
        UpdateAppSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        var settings = await appSettingsRepository.GetAsync(cancellationToken);
        AppSettingsMapper.Apply(request, settings);
        await appSettingsRepository.SaveAsync(settings, cancellationToken);
        return AppSettingsMapper.Map(settings);
    }
}
