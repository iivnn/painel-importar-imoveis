using Casa.Application.Abstractions;
using Casa.Application.Properties.GetProperties;
using Casa.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Casa.Infrastructure.Persistence.Repositories;

public class PropertyListingRepository(CasaDbContext dbContext) : IPropertyListingRepository
{
    public async Task<(IReadOnlyList<PropertyListing> Items, int TotalItems)> GetPagedAsync(
        GetPropertiesQuery query,
        CancellationToken cancellationToken = default)
    {
        var filteredQuery = ApplyFilters(new PropertyFilters
        {
            MinPrice = query.MinPrice,
            MaxPrice = query.MaxPrice,
            Neighborhood = query.Neighborhood,
            Category = query.Category,
            SwotStatus = query.SwotStatus,
            MinScore = query.MinScore
        })
            .OrderByDescending(property => property.CreatedAtUtc);

        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => query.PageSize
        };

        var totalItems = await filteredQuery.CountAsync(cancellationToken);

        var items = await filteredQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalItems);
    }

    public async Task<IReadOnlyList<PropertyListing>> GetMapItemsAsync(
        PropertyFilters filters,
        CancellationToken cancellationToken = default)
    {
        var items = await ApplyFilters(filters)
            .OrderByDescending(property => property.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return items;
    }

    public async Task<PropertyFilterOptionsResponse> GetFilterOptionsAsync(
        CancellationToken cancellationToken = default)
    {
        var baseQuery = dbContext.PropertyListings
            .AsNoTracking()
            .Where(property => !property.Excluded);

        var neighborhoods = await baseQuery
            .Where(property => property.Neighborhood != string.Empty)
            .Select(property => property.Neighborhood.Trim())
            .Distinct()
            .OrderBy(neighborhood => neighborhood)
            .ToListAsync(cancellationToken);

        var categories = await baseQuery
            .Where(property => property.Category != string.Empty)
            .Select(property => property.Category.Trim())
            .Distinct()
            .OrderBy(category => category)
            .ToListAsync(cancellationToken);

        return new PropertyFilterOptionsResponse
        {
            Neighborhoods = neighborhoods,
            Categories = categories
        };
    }

    public Task<PropertyListing?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return dbContext.PropertyListings
            .AsNoTracking()
            .FirstOrDefaultAsync(property => property.Id == id, cancellationToken);
    }

    public Task<PropertyListing?> GetForUpdateAsync(int id, CancellationToken cancellationToken = default)
    {
        return dbContext.PropertyListings
            .FirstOrDefaultAsync(property => property.Id == id, cancellationToken);
    }

    public Task<bool> HasAnyAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.PropertyListings.AnyAsync(cancellationToken);
    }

    public async Task AddAsync(PropertyListing property, CancellationToken cancellationToken = default)
    {
        await dbContext.PropertyListings.AddAsync(property, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<PropertyListing> properties, CancellationToken cancellationToken = default)
    {
        await dbContext.PropertyListings.AddRangeAsync(properties, cancellationToken);
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var affectedRows = await dbContext.PropertyListings
            .Where(property => property.Id == id && !property.Excluded)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(property => property.Excluded, true), cancellationToken);

        return affectedRows > 0;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<PropertyListing> ApplyFilters(PropertyFilters filters)
    {
        var query = dbContext.PropertyListings
            .AsNoTracking()
            .Where(property => !property.Excluded);

        if (filters.MinPrice is not null)
        {
            query = query.Where(property => property.Price != null && property.Price >= filters.MinPrice);
        }

        if (filters.MaxPrice is not null)
        {
            query = query.Where(property => property.Price != null && property.Price <= filters.MaxPrice);
        }

        if (!string.IsNullOrWhiteSpace(filters.Neighborhood))
        {
            var neighborhood = filters.Neighborhood.Trim();
            query = query.Where(property => property.Neighborhood == neighborhood);
        }

        if (!string.IsNullOrWhiteSpace(filters.Category))
        {
            var category = filters.Category.Trim();
            query = query.Where(property => property.Category == category);
        }

        if (filters.SwotStatus is not null)
        {
            query = query.Where(property => property.SwotStatus == filters.SwotStatus);
        }

        if (filters.MinScore is not null)
        {
            query = query.Where(property => property.Score != null && property.Score >= filters.MinScore);
        }

        return query;
    }
}
