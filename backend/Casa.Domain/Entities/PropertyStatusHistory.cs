using Casa.Domain.Enums;

namespace Casa.Domain.Entities;

public class PropertyStatusHistory
{
    public int Id { get; set; }

    public int PropertyListingId { get; set; }

    public PropertySwotStatus? PreviousStatus { get; set; }

    public PropertySwotStatus NewStatus { get; set; }

    public string Reason { get; set; } = string.Empty;

    public DateTime ChangedAtUtc { get; set; } = DateTime.UtcNow;

    public PropertyListing PropertyListing { get; set; } = null!;
}
