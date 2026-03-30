namespace Casa.Application.Properties.Inconsistencies;

public class PropertyInconsistenciesResponse
{
    public required PropertyInconsistencySummaryResponse Summary { get; init; }

    public required IReadOnlyList<PropertyInconsistencyResponse> Items { get; init; }
}
