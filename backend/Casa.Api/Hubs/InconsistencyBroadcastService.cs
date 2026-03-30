using Casa.Application.Properties.Inconsistencies;
using Microsoft.AspNetCore.SignalR;

namespace Casa.Api.Hubs;

public class InconsistencyBroadcastService(
    GetPropertyInconsistenciesQueryService getPropertyInconsistenciesQueryService,
    IHubContext<InconsistencyHub> hubContext)
{
    public async Task PublishSummaryAsync(CancellationToken cancellationToken = default)
    {
        var summary = await getPropertyInconsistenciesQueryService.ExecuteSummaryAsync(cancellationToken);

        await hubContext.Clients.All.SendAsync("inconsistenciesSummaryUpdated", summary, cancellationToken);
    }

    public async Task PublishPropertyCreatedAsync(int propertyId, string title, CancellationToken cancellationToken = default)
    {
        await hubContext.Clients.All.SendAsync(
            "propertyCreated",
            new
            {
                propertyId,
                title
            },
            cancellationToken);
    }
}
