using Casa.Domain.Entities;

namespace Casa.Application.Abstractions;

public interface IDismissedPropertyInconsistencyRepository
{
    Task<IReadOnlySet<string>> GetDismissedIdsAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default);
    Task SaveAsync(DismissedPropertyInconsistency dismissal, CancellationToken cancellationToken = default);
}
