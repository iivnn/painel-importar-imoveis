using Casa.Domain.Enums;

namespace Casa.Application.Properties.GetProperties;

public class PropertyFilters
{
    public decimal? MinPrice { get; init; }

    public decimal? MaxPrice { get; init; }

    public string? Neighborhood { get; init; }

    public string? Category { get; init; }

    public PropertySwotStatus? SwotStatus { get; init; }

    public decimal? MinScore { get; init; }
}
