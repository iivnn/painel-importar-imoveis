function textFromSelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const text = element?.textContent?.trim();

    if (text) {
      return text;
    }
  }

  return '';
}

function textFromMeta(selector) {
  return document.querySelector(selector)?.getAttribute('content')?.trim() || '';
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getJsonLdEntries() {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map(script => safeJsonParse(script.textContent || ''))
    .flatMap(entry => Array.isArray(entry) ? entry : entry ? [entry] : []);
}

function imageSources(selectors) {
  const values = new Set();

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(node => {
      const source = node.getAttribute('src') || node.getAttribute('data-src');
      if (source) {
        values.add(source);
      }
    });
  });

  return [...values];
}

function defaultDraft(source) {
  return {
    source,
    title: '',
    category: '',
    price: '',
    description: '',
    originalUrl: window.location.href,
    pageUrl: window.location.href,
    location: {
      addressLine: '',
      neighborhood: '',
      city: '',
      state: '',
      postalCode: ''
    },
    images: []
  };
}

function getNextData() {
  const script = document.getElementById('__NEXT_DATA__');
  if (!script?.textContent) {
    return null;
  }

  try {
    return JSON.parse(script.textContent);
  } catch {
    return null;
  }
}

function mapQuintoAndarImage(url) {
  if (!url) {
    return null;
  }

  if (url.startsWith('http')) {
    return url;
  }

  return `https://www.quintoandar.com.br/img/xlg/${url}`;
}

const STATE_NAME_TO_ACRONYM = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO'
};

function normalizeForLookup(value) {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function stateToAcronym(value) {
  const normalized = normalizeForLookup(value);
  return STATE_NAME_TO_ACRONYM[normalized] || normalizeWhitespace(value).toUpperCase();
}

function parseLocationParts(addressLine) {
  const parts = normalizeWhitespace(addressLine)
    .split(',')
    .map(part => normalizeWhitespace(part))
    .filter(Boolean);

  return {
    addressLine: parts[0] || '',
    neighborhood: parts[1] || '',
    city: parts[2] || '',
    state: parts[3] || '',
    postalCode: ''
  };
}

function parseLocationFromUrl() {
  const match = window.location.pathname.match(/\/imovel\/\d+\/(?:alugar|comprar)\/(.+)$/i);
  if (!match) {
    return null;
  }

  const slug = match[1]
    .split('?')[0]
    .split('-')
    .map(token => normalizeWhitespace(token))
    .filter(Boolean);

  if (slug.length < 2) {
    return null;
  }

  return {
    city: slug[slug.length - 1] || '',
    neighborhood: slug[slug.length - 2] || ''
  };
}

function capitalizeWords(value) {
  return normalizeWhitespace(value)
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeCategory(value) {
  const normalized = normalizeForLookup(value);

  if (!normalized) {
    return '';
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

  return capitalizeWords(value);
}

function ensureDraftLocation(draft) {
  const fromAddressLine = parseLocationParts(draft.location.addressLine);
  const fromUrl = parseLocationFromUrl();

  draft.category = normalizeCategory(draft.category);

  draft.location = {
    addressLine: normalizeWhitespace(draft.location.addressLine || fromAddressLine.addressLine),
    neighborhood: normalizeWhitespace(draft.location.neighborhood || fromAddressLine.neighborhood || fromUrl?.neighborhood),
    city: normalizeWhitespace(draft.location.city || fromAddressLine.city || fromUrl?.city),
    state: normalizeWhitespace(draft.location.state || fromAddressLine.state),
    postalCode: normalizeWhitespace(draft.location.postalCode)
  };

  if (!draft.location.neighborhood && draft.title.includes(' em ')) {
    const afterEm = draft.title.split(' em ').pop()?.split(',')[0];
    draft.location.neighborhood = capitalizeWords(afterEm || '');
  }

  draft.location.neighborhood = capitalizeWords(draft.location.neighborhood);
  draft.location.city = capitalizeWords(draft.location.city);
  draft.location.state = stateToAcronym(draft.location.state);
  draft.location.postalCode = draft.location.postalCode.replace(/[^\d-]/g, '');

  return draft;
}

function extractFromQuintoAndar() {
  const draft = defaultDraft('QuintoAndar');
  const nextData = getNextData();
  const house = nextData?.props?.pageProps?.house;
  const jsonLdEntries = getJsonLdEntries();
  const apartmentLd = jsonLdEntries.find(entry => entry?.['@type'] === 'Apartment');
  const canonicalUrl = textFromMeta('link[rel="canonical"]') || textFromMeta('meta[property="og:url"]');
  const pageTitle = document.title.replace(/\s*-\s*QuintoAndar\s*$/i, '').trim();
  const metaTitle = textFromMeta('meta[property="og:title"]') || textFromMeta('meta[name="twitter:title"]');
  const metaDescription = textFromMeta('meta[name="description"]') || textFromMeta('meta[property="og:description"]');

  draft.title =
    house?.name ||
    apartmentLd?.name ||
    metaTitle.replace(/\s*-\s*QuintoAndar\s*$/i, '').trim() ||
    pageTitle ||
    '';
  draft.category = house?.type || apartmentLd?.['@type'] || 'Apartamento';
  draft.price = house?.rentPrice ?? apartmentLd?.potentialAction?.price ?? '';
  draft.description =
    house?.generatedDescription?.longDescription ||
    house?.remarks ||
    apartmentLd?.description ||
    metaDescription ||
    '';
  draft.originalUrl = canonicalUrl || house?.canonicalUrl || window.location.href;
  draft.pageUrl = window.location.href;
  draft.latitude = house?.address?.lat ?? apartmentLd?.geo?.latitude ?? null;
  draft.longitude = house?.address?.lng ?? apartmentLd?.geo?.longitude ?? null;
  draft.hasExactLocation = Boolean(draft.latitude !== null && draft.longitude !== null);
  draft.location = {
    addressLine:
      [house?.address?.street, house?.address?.number].filter(Boolean).join(', ') ||
      apartmentLd?.address ||
      '',
    neighborhood: house?.address?.neighborhood || house?.region?.name || '',
    city: house?.address?.city || '',
    state: house?.address?.stateAcronym || house?.address?.stateName || '',
    postalCode: house?.address?.zipCode || ''
  };
  draft.images = Array.isArray(house?.photos)
    ? house.photos.map(photo => mapQuintoAndarImage(photo.url)).filter(Boolean)
    : Array.isArray(apartmentLd?.image)
      ? apartmentLd.image.filter(Boolean)
      : apartmentLd?.image
        ? [apartmentLd.image]
        : [];

  return ensureDraftLocation(draft);
}

function extractFromVivaReal() {
  const draft = defaultDraft('VivaReal');
  const title = textFromSelectors(['h1', '[data-cy="listing-title"]']);
  const price = textFromSelectors(['[data-cy="price-info-value"]', '[data-testid="price-info-value"]']);
  const description = textFromSelectors(['[data-testid="description"]', '[data-cy="description"]']);
  const address = textFromSelectors(['[data-cy="location-info-address"]', '[data-testid="address-info-value"]']);

  draft.title = title;
  draft.price = price;
  draft.description = description;
  draft.location.addressLine = address;
  draft.images = imageSources(['img']);

  return ensureDraftLocation(draft);
}

function extractFromZap() {
  const draft = defaultDraft('ZapImoveis');
  const title = textFromSelectors(['h1', '[data-cy="listing-title"]']);
  const price = textFromSelectors(['[data-cy="price-info-value"]', '[data-testid="price-info-value"]']);
  const description = textFromSelectors(['[data-testid="description"]', '[data-cy="description"]']);
  const address = textFromSelectors(['[data-cy="address-info"]', '[data-testid="address-info-value"]']);

  draft.title = title;
  draft.price = price;
  draft.description = description;
  draft.location.addressLine = address;
  draft.images = imageSources(['img']);

  return ensureDraftLocation(draft);
}

function extractFromOlx() {
  const draft = defaultDraft('Olx');
  const title = textFromSelectors(['h1', '[data-testid="ad-title"]']);
  const price = textFromSelectors(['[data-testid="ad-price-container"]', '[data-testid="price-label"]']);
  const description = textFromSelectors(['[data-testid="ad-description"]', '#description-text']);
  const address = textFromSelectors(['[data-testid="location"]', '[aria-label="Localizacao"]']);

  draft.title = title;
  draft.price = price;
  draft.description = description;
  draft.location.addressLine = address;
  draft.images = imageSources(['img']);

  return ensureDraftLocation(draft);
}

function extractCurrentListing() {
  const host = window.location.hostname;

  if (host.includes('quintoandar.com.br')) {
    return extractFromQuintoAndar();
  }

  if (host.includes('vivareal.com.br')) {
    return extractFromVivaReal();
  }

  if (host.includes('zapimoveis.com.br')) {
    return extractFromZap();
  }

  if (host.includes('olx.com.br')) {
    return extractFromOlx();
  }

  return null;
}
