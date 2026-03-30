using Casa.Domain.Enums;

namespace Casa.Application.Properties.Details;

public class PropertyStatusHistoryResponse
{
    public int Id { get; init; }

    public PropertySwotStatus? PreviousStatus { get; init; }

    public PropertySwotStatus NewStatus { get; init; }

    public string Reason { get; init; } = string.Empty;

    public DateTime ChangedAtUtc { get; init; }
}
