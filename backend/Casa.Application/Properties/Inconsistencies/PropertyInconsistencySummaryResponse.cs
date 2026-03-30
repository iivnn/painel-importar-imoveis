namespace Casa.Application.Properties.Inconsistencies;

public class PropertyInconsistencySummaryResponse
{
    public int TotalCount { get; init; }

    public int AffectedProperties { get; init; }

    public int HighSeverityCount { get; init; }

    public int MediumSeverityCount { get; init; }

    public int LowSeverityCount { get; init; }

    public DateTime GeneratedAtUtc { get; init; }
}
