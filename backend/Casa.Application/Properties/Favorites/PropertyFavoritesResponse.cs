using Casa.Application.Properties.GetProperties;

namespace Casa.Application.Properties.Favorites;

public class PropertyFavoritesResponse
{
    public required PropertyFavoriteSummaryResponse Summary { get; init; }

    public required PropertyFilterOptionsResponse FilterOptions { get; init; }

    public int Page { get; init; }

    public int PageSize { get; init; }

    public int TotalItems { get; init; }

    public int TotalPages { get; init; }

    public required IReadOnlyList<PropertyFavoriteItemResponse> Items { get; init; }
}
