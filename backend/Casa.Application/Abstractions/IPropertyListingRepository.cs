using Casa.Application.Properties.GetProperties;
using Casa.Domain.Entities;

namespace Casa.Application.Abstractions;

public interface IPropertyListingRepository
{
    Task<(IReadOnlyList<PropertyListing> Items, int TotalItems)> GetPagedAsync(
        GetPropertiesQuery query,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PropertyListing>> GetMapItemsAsync(
        PropertyFilters filters,
        CancellationToken cancellationToken = default);

    Task<PropertyFilterOptionsResponse> GetFilterOptionsAsync(
        CancellationToken cancellationToken = default);

    Task<PropertyListing?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<PropertyListing?> GetWithAttachmentsAsync(int id, CancellationToken cancellationToken = default);

    Task<PropertyListing?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PropertyListing>> GetActiveWithAttachmentsAsync(CancellationToken cancellationToken = default);

    Task<PropertyListing?> GetForUpdateAsync(int id, CancellationToken cancellationToken = default);

    Task<PropertyAttachment?> GetAttachmentForUpdateAsync(int propertyId, int attachmentId, CancellationToken cancellationToken = default);

    Task<bool> HasAnyAsync(CancellationToken cancellationToken = default);

    Task AddAsync(PropertyListing property, CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<PropertyListing> properties, CancellationToken cancellationToken = default);

    Task AddAttachmentAsync(PropertyAttachment attachment, CancellationToken cancellationToken = default);

    Task AddStatusHistoryAsync(PropertyStatusHistory history, CancellationToken cancellationToken = default);

    void RemoveAttachment(PropertyAttachment attachment);

    Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
