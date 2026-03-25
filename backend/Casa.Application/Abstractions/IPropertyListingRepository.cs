using Casa.Domain.Entities;

namespace Casa.Application.Abstractions;

public interface IPropertyListingRepository
{
    Task<(IReadOnlyList<PropertyListing> Items, int TotalItems)> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<PropertyListing?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<PropertyListing?> GetForUpdateAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> HasAnyAsync(CancellationToken cancellationToken = default);

    Task AddAsync(PropertyListing property, CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<PropertyListing> properties, CancellationToken cancellationToken = default);

    Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
