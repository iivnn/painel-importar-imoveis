using Casa.Application.Abstractions;
using Casa.Domain.Entities;

namespace Casa.Application.Properties.Inconsistencies;

public class DismissPropertyInconsistencyCommandService(
    IDismissedPropertyInconsistencyRepository dismissedPropertyInconsistencyRepository)
{
    public async Task DismissAsync(string inconsistencyId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(inconsistencyId))
        {
            throw new ArgumentException("Inconsistency id is required.", nameof(inconsistencyId));
        }

        if (await dismissedPropertyInconsistencyRepository.ExistsAsync(inconsistencyId, cancellationToken))
        {
            return;
        }

        var separatorIndex = inconsistencyId.IndexOf(':');
        var propertyId = separatorIndex > 0 && int.TryParse(inconsistencyId[..separatorIndex], out var parsedId)
            ? parsedId
            : 0;
        var type = separatorIndex > 0 && separatorIndex < inconsistencyId.Length - 1
            ? inconsistencyId[(separatorIndex + 1)..]
            : inconsistencyId;

        await dismissedPropertyInconsistencyRepository.SaveAsync(
            new DismissedPropertyInconsistency
            {
                Id = inconsistencyId,
                PropertyId = propertyId,
                Type = type,
                DismissedAtUtc = DateTime.UtcNow
            },
            cancellationToken);
    }
}
