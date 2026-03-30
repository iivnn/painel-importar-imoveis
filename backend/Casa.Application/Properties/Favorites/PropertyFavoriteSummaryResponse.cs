namespace Casa.Application.Properties.Favorites;

public class PropertyFavoriteSummaryResponse
{
    public int TotalFavorites { get; init; }

    public decimal? AveragePrice { get; init; }

    public decimal? HighestScore { get; init; }

    public IReadOnlyList<PropertyFavoriteStatusSummaryResponse> StatusBreakdown { get; init; } = [];
}
