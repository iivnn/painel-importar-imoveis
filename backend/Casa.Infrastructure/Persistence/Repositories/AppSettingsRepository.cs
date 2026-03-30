using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Casa.Infrastructure.Persistence.Repositories;

public class AppSettingsRepository(CasaDbContext dbContext) : IAppSettingsRepository
{
    public async Task<AppSettingsProfile> GetAsync(CancellationToken cancellationToken = default)
    {
        var settings = await dbContext.AppSettingsProfiles
            .FirstOrDefaultAsync(profile => profile.Id == AppSettingsProfile.SingletonId, cancellationToken);

        if (settings is not null)
        {
            return settings;
        }

        settings = new AppSettingsProfile();
        await dbContext.AppSettingsProfiles.AddAsync(settings, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return settings;
    }

    public async Task SaveAsync(AppSettingsProfile settings, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.AppSettingsProfiles
            .FirstOrDefaultAsync(profile => profile.Id == AppSettingsProfile.SingletonId, cancellationToken);

        if (existing is null)
        {
            settings.Id = AppSettingsProfile.SingletonId;
            await dbContext.AppSettingsProfiles.AddAsync(settings, cancellationToken);
        }
        else
        {
            dbContext.Entry(existing).CurrentValues.SetValues(settings);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
