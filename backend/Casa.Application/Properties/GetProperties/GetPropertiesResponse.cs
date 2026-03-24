using Casa.Domain.Entities;

namespace Casa.Application.Properties.GetProperties;

public class GetPropertiesResponse
{
    public IReadOnlyList<PropertyListing> Items { get; init; } = [];

    public int Page { get; init; }

    public int PageSize { get; init; }

    public int TotalItems { get; init; }

    public int TotalPages { get; init; }
}
