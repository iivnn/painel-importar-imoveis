using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Casa.Api.Endpoints;

public static class AddressEndpoints
{
    public static IEndpointRouteBuilder MapAddressEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/address/cep/{cep}", async (
            string cep,
            IHttpClientFactory httpClientFactory,
            CancellationToken cancellationToken) =>
        {
            var normalizedCep = new string(cep.Where(char.IsDigit).ToArray());
            if (normalizedCep.Length != 8)
            {
                return Results.BadRequest(new { message = "CEP invalido." });
            }

            var httpClient = httpClientFactory.CreateClient();
            var response = await httpClient.GetAsync(
                $"https://viacep.com.br/ws/{normalizedCep}/json/",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return Results.StatusCode(StatusCodes.Status502BadGateway);
            }

            var viaCepResponse = await response.Content.ReadFromJsonAsync<ViaCepResponse>(cancellationToken: cancellationToken);
            if (viaCepResponse is null || viaCepResponse.HasError)
            {
                return Results.NotFound(new { message = "CEP nao encontrado." });
            }

            return Results.Ok(new CepLookupResponse(
                viaCepResponse.PostalCode ?? normalizedCep,
                viaCepResponse.Street ?? string.Empty,
                viaCepResponse.Neighborhood ?? string.Empty,
                viaCepResponse.City ?? string.Empty,
                viaCepResponse.State ?? string.Empty));
        })
        .WithName("LookupAddressByCep")
        .WithOpenApi();

        return endpoints;
    }

    private sealed record ViaCepResponse(
        [property: JsonPropertyName("cep")] string? PostalCode,
        [property: JsonPropertyName("logradouro")] string? Street,
        [property: JsonPropertyName("bairro")] string? Neighborhood,
        [property: JsonPropertyName("localidade")] string? City,
        [property: JsonPropertyName("uf")] string? State,
        [property: JsonPropertyName("erro")] bool HasError);

    private sealed record CepLookupResponse(
        string PostalCode,
        string Street,
        string Neighborhood,
        string City,
        string State);
}
