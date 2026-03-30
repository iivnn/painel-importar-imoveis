using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Casa.Infrastructure.Persistence.Repositories;

public class DismissedPropertyInconsistencyRepository(CasaDbContext dbContext) : IDismissedPropertyInconsistencyRepository
{
    public async Task<IReadOnlySet<string>> GetDismissedIdsAsync(CancellationToken cancellationToken = default)
    {
        var ids = await dbContext.DismissedPropertyInconsistencies
            .AsNoTracking()
            .Select(item => item.Id)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    public Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default)
    {
        return dbContext.DismissedPropertyInconsistencies.AnyAsync(item => item.Id == id, cancellationToken);
    }

    public async Task SaveAsync(DismissedPropertyInconsistency dismissal, CancellationToken cancellationToken = default)
    {
        dbContext.DismissedPropertyInconsistencies.Add(dismissal);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
