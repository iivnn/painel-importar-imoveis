using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Domain.Enums;

namespace Casa.Application.Properties.Inconsistencies;

public class GetPropertyInconsistenciesQueryService(
    IPropertyListingRepository propertyListingRepository,
    IAppSettingsRepository appSettingsRepository,
    IDismissedPropertyInconsistencyRepository dismissedPropertyInconsistencyRepository)
{
    public async Task<PropertyInconsistenciesResponse> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var properties = await propertyListingRepository.GetActiveWithAttachmentsAsync(cancellationToken);
        var settings = await appSettingsRepository.GetAsync(cancellationToken);
        var dismissedIds = await dismissedPropertyInconsistencyRepository.GetDismissedIdsAsync(cancellationToken);
        var inconsistencies = Analyze(properties, settings, dismissedIds);

        return new PropertyInconsistenciesResponse
        {
            Summary = BuildSummary(inconsistencies),
            Items = inconsistencies
        };
    }

    public async Task<PropertyInconsistencySummaryResponse> ExecuteSummaryAsync(CancellationToken cancellationToken = default)
    {
        var properties = await propertyListingRepository.GetActiveWithAttachmentsAsync(cancellationToken);
        var settings = await appSettingsRepository.GetAsync(cancellationToken);
        var dismissedIds = await dismissedPropertyInconsistencyRepository.GetDismissedIdsAsync(cancellationToken);
        var inconsistencies = Analyze(properties, settings, dismissedIds);

        return BuildSummary(inconsistencies);
    }

    private static IReadOnlyList<PropertyInconsistencyResponse> Analyze(
        IReadOnlyList<PropertyListing> properties,
        AppSettingsProfile settings,
        IReadOnlySet<string> dismissedIds)
    {
        var results = new List<PropertyInconsistencyResponse>();
        var requiredSwotStatuses = ParseStatuses(settings.RequireSwotStatuses);
        var requiredNotesStatuses = ParseStatuses(settings.RequireNotesStatuses);
        var requiredMediaStatuses = ParseStatuses(settings.RequireMediaStatuses);
        var preferredNeighborhoods = ParseList(settings.PreferredNeighborhoods);
        var avoidedNeighborhoods = ParseList(settings.AvoidedNeighborhoods);
        var duplicateUrls = properties
            .Where(property => !string.IsNullOrWhiteSpace(property.OriginalUrl))
            .GroupBy(property => property.OriginalUrl.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .ToDictionary(group => group.Key, group => group.ToList(), StringComparer.OrdinalIgnoreCase);

        var duplicateFingerprints = properties
            .GroupBy(property => BuildFingerprint(property), StringComparer.OrdinalIgnoreCase)
            .Where(group => !string.IsNullOrWhiteSpace(group.Key) && group.Count() > 1)
            .ToDictionary(group => group.Key, group => group.ToList(), StringComparer.OrdinalIgnoreCase);

        foreach (var property in properties)
        {
            AppendMissingLocation(results, property, settings);
            AppendDuplicateUrl(results, property, duplicateUrls);
            AppendDuplicateFingerprint(results, property, duplicateFingerprints);
            AppendPriceOutlier(results, property, properties, settings);
            AppendMissingSwot(results, property, requiredSwotStatuses);
            AppendMissingVisitNotes(results, property, requiredNotesStatuses);
            AppendMissingVisitMedia(results, property, requiredMediaStatuses, settings.MinimumPhotoCount);
            AppendBrokenSourceData(results, property, settings);
            AppendBudgetAlerts(results, property, settings);
            AppendNeighborhoodAlerts(results, property, preferredNeighborhoods, avoidedNeighborhoods);
        }

        return results
            .Where(item => !dismissedIds.Contains(item.Id))
            .OrderByDescending(item => SeverityWeight(item.Severity))
            .ThenBy(item => item.PropertyTitle)
            .ThenBy(item => item.Title)
            .ToList();
    }

    private static void AppendMissingLocation(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        AppSettingsProfile settings)
    {
        var hasAddressGaps =
            string.IsNullOrWhiteSpace(property.AddressLine)
            || string.IsNullOrWhiteSpace(property.Neighborhood)
            || string.IsNullOrWhiteSpace(property.City)
            || string.IsNullOrWhiteSpace(property.State)
            || string.IsNullOrWhiteSpace(property.PostalCode);

        if (hasAddressGaps)
        {
            results.Add(Create(
                property,
                "alta",
                "localizacao-incompleta",
                "Localizacao textual incompleta",
                "Faltam partes importantes do endereco para identificar o imovel com seguranca.",
                "Preencha endereco, bairro, cidade, estado e CEP antes de seguir com a analise."));
        }

        if (settings.RequireCoordinatesForCompleteLocation && (property.Latitude is null || property.Longitude is null))
        {
            results.Add(Create(
                property,
                "alta",
                "sem-coordenadas",
                "Mapa sem coordenadas",
                "O imovel nao tem latitude e longitude, entao nao pode ser avaliado corretamente no mapa.",
                "Complete a localizacao no cadastro ou use um ponto aproximado para nao perder contexto geografico."));
        }
        else if (!property.HasExactLocation)
        {
            results.Add(Create(
                property,
                "media",
                "coordenada-aproximada",
                "Localizacao aproximada",
                "O ponto do mapa nao esta marcado como exato.",
                "Confirme a posicao exata no anuncio ou no Google Maps e marque a localizacao precisa."));
        }
    }

    private static void AppendDuplicateUrl(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        IReadOnlyDictionary<string, List<PropertyListing>> duplicateUrls)
    {
        if (string.IsNullOrWhiteSpace(property.OriginalUrl))
        {
            return;
        }

        var normalizedUrl = property.OriginalUrl.Trim();
        if (!duplicateUrls.TryGetValue(normalizedUrl, out var duplicates))
        {
            return;
        }

        results.Add(Create(
            property,
            "alta",
            "anuncio-duplicado-link",
            "Anuncio duplicado pelo link",
            $"O mesmo link aparece em {duplicates.Count} registros, o que sugere duplicidade.",
            "Mantenha apenas um registro ou diferencie claramente quando forem variacoes reais do mesmo anuncio."));
    }

    private static void AppendDuplicateFingerprint(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        IReadOnlyDictionary<string, List<PropertyListing>> duplicateFingerprints)
    {
        var fingerprint = BuildFingerprint(property);
        if (string.IsNullOrWhiteSpace(fingerprint) || !duplicateFingerprints.TryGetValue(fingerprint, out var duplicates))
        {
            return;
        }

        results.Add(Create(
            property,
            "media",
            "anuncio-duplicado-perfil",
            "Possivel duplicidade de cadastro",
            $"Existem {duplicates.Count} registros com titulo, valor e regiao muito parecidos.",
            "Revise os cadastros semelhantes e veja se vale consolidar tudo em um unico imovel."));
    }

    private static void AppendPriceOutlier(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        IReadOnlyList<PropertyListing> properties,
        AppSettingsProfile settings)
    {
        if (property.Price is null)
        {
            return;
        }

        var comparablePrices = properties
            .Where(candidate =>
                candidate.Id != property.Id
                && candidate.Price is not null
                && string.Equals(candidate.Neighborhood, property.Neighborhood, StringComparison.OrdinalIgnoreCase)
                && string.Equals(candidate.Category, property.Category, StringComparison.OrdinalIgnoreCase))
            .Select(candidate => candidate.Price!.Value)
            .ToList();

        if (comparablePrices.Count < 3)
        {
            return;
        }

        var average = comparablePrices.Average();
        if (average <= 0)
        {
            return;
        }

        if (property.Price.Value <= average * settings.PriceBelowAverageRatio)
        {
            results.Add(Create(
                property,
                "alta",
                "preco-abaixo-da-regiao",
                "Preco muito abaixo da regiao",
                $"O valor esta bem abaixo da media de imoveis parecidos no mesmo bairro e categoria ({average:F0}).",
                "Verifique se o anuncio esta desatualizado, incompleto ou se existe algum risco escondido no imovel."));
            return;
        }

        if (property.Price.Value >= average * settings.PriceAboveAverageRatio)
        {
            results.Add(Create(
                property,
                "baixa",
                "preco-acima-da-regiao",
                "Preco acima da referencia local",
                $"O valor esta acima da media de imoveis comparaveis na regiao ({average:F0}).",
                "Confirme se os diferenciais justificam o preco ou se vale rebaixar a prioridade desse imovel."));
        }
    }

    private static void AppendMissingSwot(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        IReadOnlySet<PropertySwotStatus> requiredStatuses)
    {
        var hasSwotContent =
            !string.IsNullOrWhiteSpace(property.Strengths)
            || !string.IsNullOrWhiteSpace(property.Weaknesses)
            || !string.IsNullOrWhiteSpace(property.Opportunities)
            || !string.IsNullOrWhiteSpace(property.Threats)
            || property.Score is not null;

        if (requiredStatuses.Contains(property.SwotStatus) && !hasSwotContent)
        {
            results.Add(Create(
                property,
                "media",
                "status-sem-analise",
                "Status avancado sem analise registrada",
                "O imovel ja avancou no fluxo, mas ainda nao tem SWOT ou nota preenchida.",
                "Abra a analise SWOT e registre pelo menos os pontos principais antes de continuar."));
        }
    }

    private static void AppendMissingVisitNotes(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        IReadOnlySet<PropertySwotStatus> requiredStatuses)
    {
        if (!requiredStatuses.Contains(property.SwotStatus))
        {
            return;
        }

        if (!string.IsNullOrWhiteSpace(property.Notes))
        {
            return;
        }

        results.Add(Create(
            property,
            "media",
            "visita-sem-observacao",
            "Visita sem observacoes",
            "O status indica um passo avancado, mas nao ha observacoes registradas.",
            "Adicione notas sobre impressao da visita, condicoes do imovel e pontos de negociacao."));
    }

    private static void AppendMissingVisitMedia(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        IReadOnlySet<PropertySwotStatus> requiredStatuses,
        int minimumPhotoCount)
    {
        if (!requiredStatuses.Contains(property.SwotStatus))
        {
            return;
        }

        var photoCount = property.Attachments.Count(attachment => attachment.Kind == PropertyAttachmentKind.Foto);
        if (photoCount >= minimumPhotoCount)
        {
            return;
        }

        results.Add(Create(
            property,
            "baixa",
            "visita-sem-midia",
            "Visita sem fotos ou prints",
            $"O cadastro tem {photoCount} foto(s) e a configuracao atual pede pelo menos {minimumPhotoCount}.",
            "Anexe fotos ou prints suficientes para facilitar a comparacao depois."));
    }

    private static void AppendBrokenSourceData(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        AppSettingsProfile settings)
    {
        if (property.Price is null)
        {
            results.Add(Create(
                property,
                "media",
                "valor-ausente",
                "Valor nao informado",
                "O cadastro ainda nao tem preco preenchido.",
                "Defina o valor para permitir comparacoes, filtros e analises de custo-beneficio."));
        }

        if (settings.RequireOriginalUrl && string.IsNullOrWhiteSpace(property.OriginalUrl))
        {
            results.Add(Create(
                property,
                "baixa",
                "sem-link-do-anuncio",
                "Link do anuncio ausente",
                "Nao ha link para consultar a origem do cadastro.",
                "Adicione a URL do anuncio original para conferir fotos, descricao e atualizacoes."));
        }
    }

    private static void AppendBudgetAlerts(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        AppSettingsProfile settings)
    {
        if (property.Price is null)
        {
            return;
        }

        if (settings.MonthlyBudgetMax > 0 && property.Price > settings.MonthlyBudgetMax)
        {
            results.Add(Create(
                property,
                "alta",
                "acima-do-teto",
                "Preco acima do teto definido",
                $"O valor ultrapassa o teto mensal configurado ({settings.MonthlyBudgetMax:F0}).",
                "Reavalie a prioridade desse imovel ou ajuste o teto nas configuracoes, se fizer sentido."));
            return;
        }

        if (settings.MonthlyBudgetIdeal > 0 && property.Price > settings.MonthlyBudgetIdeal)
        {
            results.Add(Create(
                property,
                "baixa",
                "acima-do-ideal",
                "Preco acima do ideal",
                $"O valor esta acima da faixa ideal configurada ({settings.MonthlyBudgetIdeal:F0}).",
                "Compare com outras opcoes na mesma faixa e veja se os diferenciais compensam."));
        }
    }

    private static void AppendNeighborhoodAlerts(
        List<PropertyInconsistencyResponse> results,
        PropertyListing property,
        IReadOnlySet<string> preferredNeighborhoods,
        IReadOnlySet<string> avoidedNeighborhoods)
    {
        if (avoidedNeighborhoods.Contains(property.Neighborhood))
        {
            results.Add(Create(
                property,
                "media",
                "bairro-evitado",
                "Bairro marcado como evitado",
                "O imovel esta em um bairro que voce marcou como pouco desejado nas configuracoes.",
                "Confirme se ele ainda faz sentido para a shortlist ou remova a restricao, se ela mudou."));
        }

        if (preferredNeighborhoods.Count > 0 && !preferredNeighborhoods.Contains(property.Neighborhood))
        {
            results.Add(Create(
                property,
                "baixa",
                "fora-dos-bairros-preferidos",
                "Fora dos bairros preferidos",
                "O imovel nao esta na lista de bairros preferidos definida no sistema.",
                "Considere se a localizacao ainda compensa ou atualize a lista de bairros preferidos."));
        }
    }

    private static PropertyInconsistencyResponse Create(
        PropertyListing property,
        string severity,
        string type,
        string title,
        string description,
        string recommendation)
    {
        return new PropertyInconsistencyResponse
        {
            Id = $"{property.Id}:{type}",
            PropertyId = property.Id,
            PropertyTitle = property.Title,
            Severity = severity,
            Type = type,
            Title = title,
            Description = description,
            Recommendation = recommendation
        };
    }

    private static string BuildFingerprint(PropertyListing property)
    {
        var title = property.Title?.Trim();
        var neighborhood = property.Neighborhood?.Trim();
        var city = property.City?.Trim();
        var price = property.Price?.ToString("F2");

        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(neighborhood) || string.IsNullOrWhiteSpace(price))
        {
            return string.Empty;
        }

        return $"{title}|{neighborhood}|{city}|{price}";
    }

    private static PropertyInconsistencySummaryResponse BuildSummary(IReadOnlyList<PropertyInconsistencyResponse> items)
    {
        return new PropertyInconsistencySummaryResponse
        {
            TotalCount = items.Count,
            AffectedProperties = items.Select(item => item.PropertyId).Distinct().Count(),
            HighSeverityCount = items.Count(item => item.Severity == "alta"),
            MediumSeverityCount = items.Count(item => item.Severity == "media"),
            LowSeverityCount = items.Count(item => item.Severity == "baixa"),
            GeneratedAtUtc = DateTime.UtcNow
        };
    }

    private static int SeverityWeight(string severity)
    {
        return severity switch
        {
            "alta" => 3,
            "media" => 2,
            "baixa" => 1,
            _ => 0
        };
    }

    private static HashSet<PropertySwotStatus> ParseStatuses(string statuses)
    {
        return statuses
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(status => Enum.TryParse<PropertySwotStatus>(status, true, out var parsedStatus)
                ? parsedStatus
                : (PropertySwotStatus?)null)
            .Where(status => status is not null)
            .Select(status => status!.Value)
            .ToHashSet();
    }

    private static HashSet<string> ParseList(string values)
    {
        return values
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
