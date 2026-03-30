using Casa.Domain.Enums;

namespace Casa.Application.Properties.Favorites;

public class PropertyFavoriteItemResponse
{
    public int Id { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public PropertySource Source { get; init; }

    public string OriginalUrl { get; init; } = string.Empty;

    public PropertySwotStatus SwotStatus { get; init; }

    public decimal? Price { get; init; }

    public string AddressLine { get; init; } = string.Empty;

    public string Neighborhood { get; init; } = string.Empty;

    public string City { get; init; } = string.Empty;

    public string State { get; init; } = string.Empty;

    public decimal? Latitude { get; init; }

    public decimal? Longitude { get; init; }

    public bool HasExactLocation { get; init; }

    public decimal? Score { get; init; }

    public string StrengthsPreview { get; init; } = string.Empty;

    public string ThreatsPreview { get; init; } = string.Empty;

    public bool HasNotes { get; init; }

    public bool HasMedia { get; init; }

    public int MediaCount { get; init; }

    public IReadOnlyList<string> ThumbnailUrls { get; init; } = [];

    public DateTime CreatedAtUtc { get; init; }
}
