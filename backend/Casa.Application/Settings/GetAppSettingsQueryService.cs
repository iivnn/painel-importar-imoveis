using Casa.Application.Abstractions;

namespace Casa.Application.Settings;

public class GetAppSettingsQueryService(IAppSettingsRepository appSettingsRepository)
{
    public async Task<AppSettingsResponse> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var settings = await appSettingsRepository.GetAsync(cancellationToken);
        return AppSettingsMapper.Map(settings);
    }
}
