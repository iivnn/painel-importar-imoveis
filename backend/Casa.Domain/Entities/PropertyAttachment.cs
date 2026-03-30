using Casa.Domain.Enums;

namespace Casa.Domain.Entities;

public class PropertyAttachment
{
    public int Id { get; set; }

    public int PropertyListingId { get; set; }

    public PropertyAttachmentKind Kind { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string StoredFileName { get; set; } = string.Empty;

    public string RelativePath { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public PropertyListing PropertyListing { get; set; } = null!;
}
