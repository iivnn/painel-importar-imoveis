namespace Casa.Application.Properties.GetProperties;

public class PropertyFilterOptionsResponse
{
    public IReadOnlyList<string> Neighborhoods { get; init; } = [];

    public IReadOnlyList<string> Categories { get; init; } = [];
}
