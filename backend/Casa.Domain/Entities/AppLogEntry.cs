using Casa.Domain.Enums;

namespace Casa.Domain.Entities;

public class AppLogEntry
{
    public long Id { get; set; }

    public AppLogSource Source { get; set; }

    public AppLogLevel Level { get; set; }

    public string Category { get; set; } = string.Empty;

    public string EventName { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string DetailsJson { get; set; } = string.Empty;

    public string TraceId { get; set; } = string.Empty;

    public string Path { get; set; } = string.Empty;

    public string Method { get; set; } = string.Empty;

    public string UserAgent { get; set; } = string.Empty;

    public string RelatedEntityType { get; set; } = string.Empty;

    public string RelatedEntityId { get; set; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; }
}
