function normalizePrice(value) {
  if (!value) {
    return null;
  }

  const digits = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitLocation(location) {
  return {
    addressLine: String(location?.addressLine || '').trim(),
    neighborhood: String(location?.neighborhood || '').trim(),
    city: String(location?.city || '').trim(),
    state: String(location?.state || '').trim(),
    postalCode: String(location?.postalCode || '').trim()
  };
}

function normalizeCategory(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) {
    return 'Apartamento';
  }

  if (normalized === 'apartment' || normalized === 'apartamento') {
    return 'Apartamento';
  }

  if (normalized === 'house' || normalized === 'casa') {
    return 'Casa';
  }

  if (normalized === 'studio' || normalized === 'kitnet' || normalized === 'kitinete') {
    return 'Studio';
  }

  if (normalized === 'condominium' || normalized === 'condominio') {
    return 'Condominio';
  }

  return String(value || '').trim();
}

export function mapDraftToCreateRequest(draft) {
  const location = splitLocation(draft.location || {});

  return {
    title: draft.title || '',
    category: normalizeCategory(draft.category),
    source: draft.source ? 'PortalWeb' : 'AppExterno',
    originalUrl: draft.originalUrl || draft.pageUrl || '',
    price: normalizePrice(draft.price),
    addressLine: location.addressLine,
    neighborhood: location.neighborhood,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    latitude: draft.latitude ?? null,
    longitude: draft.longitude ?? null,
    hasExactLocation: draft.latitude !== null && draft.longitude !== null,
    condoFee: null,
    iptu: null,
    insurance: null,
    upfrontCost: null,
    notes: buildImportNotes(draft),
    discardReason: '',
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: ''
  };
}

export function getMissingRequiredFields(draft) {
  const location = splitLocation(draft?.location || {});
  const missing = [];
  const hasCoordinates =
    Number.isFinite(Number(draft?.latitude)) &&
    Number.isFinite(Number(draft?.longitude));

  if (!String(draft?.title || '').trim()) missing.push('titulo');
  if (!String(draft?.category || '').trim()) missing.push('categoria');
  if (!location.addressLine) missing.push('endereco');
  if (!location.neighborhood) missing.push('bairro');
  if (!location.city) missing.push('cidade');
  if (!location.state && !hasCoordinates) missing.push('estado');

  return missing;
}

function buildImportNotes(draft) {
  const lines = [
    `Importado automaticamente em ${new Date().toLocaleString('pt-BR')}.`
  ];

  if (draft.description) {
    lines.push('', 'Descricao encontrada no anuncio:', draft.description);
  }

  return lines.join('\n').trim();
}
