using Casa.Domain.Enums;

namespace Casa.Application.Properties.GetProperties;

public class GetPropertiesQuery
{
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 10;

    public decimal? MinPrice { get; init; }

    public decimal? MaxPrice { get; init; }

    public string? Neighborhood { get; init; }

    public string? Category { get; init; }

    public PropertySwotStatus? SwotStatus { get; init; }

    public decimal? MinScore { get; init; }

    public bool OnlyFavorites { get; init; }

    public bool OnlyWithSwot { get; init; }

    public bool OnlyWithNotes { get; init; }

    public bool OnlyWithMedia { get; init; }
}
