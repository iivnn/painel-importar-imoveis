namespace Casa.Application.Properties.Inconsistencies;

public class PropertyInconsistencyResponse
{
    public required string Id { get; init; }

    public required int PropertyId { get; init; }

    public required string PropertyTitle { get; init; }

    public required string Severity { get; init; }

    public required string Type { get; init; }

    public required string Title { get; init; }

    public required string Description { get; init; }

    public required string Recommendation { get; init; }
}
