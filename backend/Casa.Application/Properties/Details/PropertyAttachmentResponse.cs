using Casa.Domain.Enums;

namespace Casa.Application.Properties.Details;

public class PropertyAttachmentResponse
{
    public int Id { get; init; }

    public PropertyAttachmentKind Kind { get; init; }

    public string OriginalFileName { get; init; } = string.Empty;

    public string FileUrl { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public DateTime CreatedAtUtc { get; init; }
}
