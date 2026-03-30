using Casa.Domain.Entities;

namespace Casa.Application.Abstractions;

public interface IAppSettingsRepository
{
    Task<AppSettingsProfile> GetAsync(CancellationToken cancellationToken = default);

    Task SaveAsync(AppSettingsProfile settings, CancellationToken cancellationToken = default);
}
