using Casa.Domain.Enums;

namespace Casa.Application.Properties.Status;

public class UpdatePropertyStatusRequest
{
    public PropertySwotStatus SwotStatus { get; set; }

    public string Reason { get; set; } = string.Empty;
}
