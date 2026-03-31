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

function normalizeForLookup(value) {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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
      if (source && /^https?:\/\//i.test(source)) {
        values.add(source);
      }
    });
  });

  return [...values];
}

function collectImageCandidates(selectors) {
  const values = new Set();

  function addCandidate(source) {
    const normalized = normalizeImageUrl(source);

    if (!normalized) {
      return;
    }

    const blockedTerms = ['logo', 'placeholder', 'avatar', 'icon', 'sprite'];
    const normalizedUrl = normalized.toLowerCase();

    if (blockedTerms.some(term => normalizedUrl.includes(term))) {
      return;
    }

    values.add(normalized);
  }

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(node => {
      [
        node.getAttribute('src'),
        node.getAttribute('data-src'),
        node.getAttribute('data-lazy-src'),
        node.getAttribute('data-original'),
        node.getAttribute('content')
      ].forEach(addCandidate);

      extractUrlsFromSrcset(node.getAttribute('srcset')).forEach(addCandidate);
      extractUrlsFromSrcset(node.getAttribute('data-srcset')).forEach(addCandidate);
    });
  });

  getJsonLdEntries().forEach(entry => {
    const images = Array.isArray(entry?.image)
      ? entry.image
      : entry?.image
        ? [entry.image]
        : [];

    images.forEach(image => {
      if (typeof image === 'string') {
        addCandidate(image);
      } else if (image?.url) {
        addCandidate(image.url);
      } else if (image?.contentUrl) {
        addCandidate(image.contentUrl);
      }
    });
  });

  return [...values];
}

function collectVivaRealGalleryImages(listingTitle) {
  const values = new Set();
  const normalizedTitle = normalizeForLookup(String(listingTitle || '').replace(/\s+por\s+r\$\s*[\d\.\,\/mês]+/i, ''));
  const nodes = [...document.querySelectorAll('img, picture source, meta[property="og:image"], meta[name="twitter:image"]')];

  for (const node of nodes) {
    const attributesText = normalizeForLookup([
      node.getAttribute?.('alt'),
      node.getAttribute?.('aria-label'),
      node.getAttribute?.('title'),
      node.getAttribute?.('content')
    ].filter(Boolean).join(' '));

    const urls = [
      typeof node.currentSrc === 'string' ? node.currentSrc : '',
      typeof node.src === 'string' ? node.src : '',
      node.getAttribute?.('src'),
      node.getAttribute?.('data-src'),
      node.getAttribute?.('data-lazy-src'),
      node.getAttribute?.('data-original'),
      node.getAttribute?.('content'),
      node.getAttribute?.('href'),
      ...extractUrlsFromSrcset(node.getAttribute?.('srcset')),
      ...extractUrlsFromSrcset(node.getAttribute?.('data-srcset'))
    ];

    for (const url of urls) {
      const normalizedUrl = normalizeImageUrl(url);

      if (!normalizedUrl) {
        continue;
      }

      const isImageHost =
        normalizedUrl.includes('mediacdn') ||
        normalizedUrl.includes('grupozap') ||
        normalizedUrl.includes('resized') ||
        normalizedUrl.includes('cdn');

      if (!isImageHost) {
        continue;
      }

      const matchesTitle =
        normalizedTitle &&
        attributesText &&
        (attributesText.includes(normalizedTitle) ||
          normalizedTitle.includes(attributesText) ||
          attributesText.includes('viva real'));

      const looksLikeGalleryImage =
        attributesText.includes('por r$') ||
        attributesText.includes('foto') ||
        attributesText.includes('imagem');

      if (!matchesTitle && !looksLikeGalleryImage) {
        continue;
      }

      values.add(normalizedUrl);
    }
  }

  return [...values].slice(0, 30);
}

function extractUrlsFromSrcset(value) {
  return String(value || '')
    .split(',')
    .map(part => normalizeWhitespace(part).split(' ')[0])
    .filter(Boolean);
}

function normalizeImageUrl(value) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return '';
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('//')) {
    return `${window.location.protocol}${normalized}`;
  }

  if (normalized.startsWith('/')) {
    return `${window.location.origin}${normalized}`;
  }

  return '';
}

function defaultDraft(source) {
  return {
    source,
    title: '',
    category: '',
    price: '',
    condoFee: '',
    iptu: '',
    insurance: '',
    serviceFee: '',
    totalMonthlyCost: '',
    upfrontCost: '',
    description: '',
    originalUrl: window.location.href,
    pageUrl: window.location.href,
    latitude: null,
    longitude: null,
    hasExactLocation: false,
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

function parseVivaRealLocationFromUrl() {
  const match = window.location.pathname.match(/\/imovel\/(.+)-bairros-(.+?)-(?:\d+m2|aluguel|venda)/i);
  if (!match) {
    return null;
  }

  return {
    neighborhood: capitalizeWords(match[1].replace(/-/g, ' ')),
    city: capitalizeWords(match[2].replace(/-/g, ' '))
  };
}

function parseZapLocationFromUrl() {
  const segments = window.location.pathname
    .split('/')
    .map(segment => normalizeWhitespace(segment))
    .filter(Boolean);

  const slug = segments.find(segment => segment.includes('-id-'));
  if (!slug) {
    return null;
  }

  const baseSlug = slug.replace(/-id-\d+$/i, '');
  const parts = baseSlug.split('-').filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const state = parts[parts.length - 1]?.toUpperCase();
  const city = capitalizeWords(parts[parts.length - 2] || '');

  const ignoredTokens = new Set([
    'aluguel', 'venda', 'apartamento', 'casa', 'studio', 'kitnet',
    'quarto', 'quartos', 'banheiro', 'banheiros', 'vaga', 'vagas',
    'com', 'sem', 'piscina', 'suite', 'suites'
  ]);

  const neighborhoodTokens = parts
    .slice(0, -2)
    .filter(token => !ignoredTokens.has(normalizeForLookup(token)) && !/^\d+m2$/i.test(token) && !/^\d+$/.test(token));

  return {
    neighborhood: capitalizeWords(neighborhoodTokens.slice(-2).join(' ')),
    city,
    state
  };
}

function parseOlxLocationFromUrl() {
  const hostnameParts = window.location.hostname.split('.');
  const statePrefix = hostnameParts.length > 2 ? hostnameParts[0] : '';
  const path = window.location.pathname;
  const cityRegionMatch = path.match(/^\/([^/]+)\/imoveis\//i);
  const slugMatch = path.match(/\/imoveis\/(.+?)-(\d+)(?:\/)?$/i);

  const cityRegion = cityRegionMatch?.[1]?.replace(/-e-regiao$/i, '') || '';
  const slug = slugMatch?.[1] || '';
  const tokens = slug.split('-').filter(Boolean);

  const ignoredTokens = new Set([
    'apartamento', 'casa', 'sala', 'comercial', 'studio', 'kitnet', 'kitinete',
    'quarto', 'quartos', 'banheiro', 'banheiros', 'vaga', 'vagas',
    'para', 'alugar', 'vender', 'com', 'sem', 'piscina', 'suite', 'suites'
  ]);

  const neighborhoodTokens = tokens.filter(token =>
    !ignoredTokens.has(normalizeForLookup(token)) &&
    !/^\d+m2$/i.test(token) &&
    !/^\d+$/.test(token)
  );

  return {
    neighborhood: capitalizeWords(neighborhoodTokens.slice(-2).join(' ')),
    city: capitalizeWords(cityRegion.replace(/-/g, ' ')),
    state: statePrefix ? statePrefix.toUpperCase() : ''
  };
}

function parseVivaRealAddress(address) {
  const normalized = normalizeWhitespace(address);

  if (!normalized) {
    return null;
  }

  const fullMatch = normalized.match(/^(.*?),\s*([^,-]+?)\s*-\s*(.*?),\s*(.*?)\s*-\s*([A-Za-z]{2})$/);
  if (fullMatch) {
    return {
      addressLine: `${fullMatch[1].trim()}, ${fullMatch[2].trim()}`,
      neighborhood: fullMatch[3].trim(),
      city: fullMatch[4].trim(),
      state: fullMatch[5].trim().toUpperCase()
    };
  }

  const looseMatch = normalized.match(/^(.*?)\s*-\s*(.*?),\s*(.*?)\s*-\s*([A-Za-z]{2})$/);
  if (looseMatch) {
    return {
      addressLine: looseMatch[1].trim(),
      neighborhood: looseMatch[2].trim(),
      city: looseMatch[3].trim(),
      state: looseMatch[4].trim().toUpperCase()
    };
  }

  return null;
}

function parseZapAddress(address) {
  return parseVivaRealAddress(address);
}

function parseOlxLocationLine(locationLine, fallback) {
  const normalized = normalizeWhitespace(locationLine);

  if (!normalized) {
    return {
      addressLine: fallback?.neighborhood ? `Regiao de ${fallback.neighborhood}` : '',
      neighborhood: fallback?.neighborhood || '',
      city: fallback?.city || '',
      state: fallback?.state || '',
      postalCode: ''
    };
  }

  const cepMatch = normalized.match(/(\d{5}-?\d{3})$/);
  const withoutPostalCode = cepMatch ? normalized.slice(0, cepMatch.index).replace(/,\s*$/, '').trim() : normalized;
  const stateMatch = withoutPostalCode.match(/,\s*([A-Za-z]{2})$/);
  const state = stateMatch?.[1]?.toUpperCase() || fallback?.state || '';
  const beforeState = stateMatch ? withoutPostalCode.slice(0, stateMatch.index).trim() : withoutPostalCode;

  let neighborhood = fallback?.neighborhood || '';
  let city = fallback?.city || '';

  if (city && beforeState.toLowerCase().endsWith(city.toLowerCase())) {
    neighborhood = beforeState.slice(0, beforeState.length - city.length).trim();
  } else {
    const lastSpace = beforeState.lastIndexOf(' ');
    if (lastSpace > 0) {
      neighborhood = beforeState.slice(0, lastSpace).trim();
      city = beforeState.slice(lastSpace + 1).trim();
    } else {
      neighborhood = beforeState.trim();
    }
  }

  neighborhood = normalizeWhitespace(neighborhood);
  city = capitalizeWords(city);

  return {
    addressLine: neighborhood ? `Regiao de ${capitalizeWords(neighborhood)}` : (city ? `Regiao central de ${city}` : 'Endereco aproximado'),
    neighborhood: capitalizeWords(neighborhood || fallback?.neighborhood || ''),
    city: city || capitalizeWords(fallback?.city || ''),
    state,
    postalCode: cepMatch?.[1] || ''
  };
}

function parseImovelwebAddress(addressLine, fallbackTitle = '') {
  const normalized = normalizeWhitespace(addressLine);
  const result = {
    addressLine: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: ''
  };

  if (normalized) {
    const parts = normalized
      .split(',')
      .map(part => normalizeWhitespace(part))
      .filter(Boolean);

    result.addressLine = parts[0] || '';

    if (parts.length >= 4) {
      result.neighborhood = capitalizeWords(parts[1] || '');
      result.city = capitalizeWords(parts[2] || '');
      result.state = stateToAcronym(parts[3] || '');
    } else if (parts.length === 3) {
      const thirdPart = parts[2] || '';
      const thirdPartLooksLikeState =
        thirdPart.length === 2 ||
        Object.prototype.hasOwnProperty.call(STATE_NAME_TO_ACRONYM, normalizeForLookup(thirdPart));

      if (thirdPartLooksLikeState) {
        result.city = capitalizeWords(parts[1] || '');
        result.state = stateToAcronym(thirdPart);
      } else {
        result.neighborhood = capitalizeWords(parts[1] || '');
        result.city = capitalizeWords(thirdPart);
      }
    } else if (parts.length === 2) {
      result.city = capitalizeWords(parts[1] || '');
    }
  }

  const normalizedTitle = String(fallbackTitle || '');
  const neighborhoodMatch =
    normalizedTitle.match(/bairro\s+dos?\s+([^(–-]+)/i) ||
    normalizedTitle.match(/bairro\s+([^(–-]+)/i) ||
    normalizedTitle.match(/-\s*([^()]+)\(([^)]+)\)/i);

  if (neighborhoodMatch?.[1]) {
    const candidate = normalizeWhitespace(neighborhoodMatch[1].replace(/[–-]+$/g, ''));
    if (candidate && !normalizeForLookup(candidate).startsWith('para locacao')) {
      result.neighborhood = capitalizeWords(candidate);
    }
  }

  if (!result.neighborhood && neighborhoodMatch?.[2]) {
    result.neighborhood = capitalizeWords(neighborhoodMatch[2]);
  }

  return result;
}

function parseImovelwebLocationFromUrl() {
  const slug = window.location.pathname
    .split('/')
    .filter(Boolean)
    .pop() || '';

  if (!slug) {
    return null;
  }

  const normalizedSlug = slug.replace(/-\d+\.html$/i, '').replace(/\.html$/i, '');
  const bairroMatch =
    normalizedSlug.match(/bairro-([a-z0-9-]+)/i) ||
    normalizedSlug.match(/(?:casa|apartamento|imovel|sala)-([a-z0-9-]+)-[a-z]{2,}$/i);

  if (!bairroMatch?.[1]) {
    return null;
  }

  return {
    neighborhood: capitalizeWords(bairroMatch[1].replace(/-/g, ' '))
  };
}

function collectImovelwebGalleryImages(listingTitle) {
  const normalizedTitle = normalizeForLookup(listingTitle);
  const values = new Set();
  const candidates = [
    ...collectImageCandidates([
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'picture source',
      'img'
    ]),
    ...imageSources(['img', 'picture source'])
  ];

  candidates.forEach(url => {
    const normalizedUrl = normalizeImageUrl(url);
    if (!normalizedUrl) {
      return;
    }

    const loweredUrl = normalizedUrl.toLowerCase();
    const isLikelyListingImage =
      loweredUrl.includes('imovelweb') ||
      loweredUrl.includes('argenprop') ||
      loweredUrl.includes('navent') ||
      loweredUrl.includes('resizer') ||
      loweredUrl.includes('/image') ||
      loweredUrl.includes('/images');

    if (!isLikelyListingImage) {
      return;
    }

    if (
      loweredUrl.includes('logo') ||
      loweredUrl.includes('icon') ||
      loweredUrl.includes('sprite') ||
      loweredUrl.includes('placeholder') ||
      loweredUrl.includes('avatar') ||
      loweredUrl.includes('googleapis')
    ) {
      return;
    }

    values.add(normalizedUrl);
  });

  document.querySelectorAll('img').forEach(node => {
    const altText = normalizeForLookup(node.getAttribute('alt'));
    const currentSrc = normalizeImageUrl(node.currentSrc || node.src || node.getAttribute('src'));

    if (!currentSrc) {
      return;
    }

    const loweredUrl = currentSrc.toLowerCase();
    if (
      loweredUrl.includes('logo') ||
      loweredUrl.includes('icon') ||
      loweredUrl.includes('sprite') ||
      loweredUrl.includes('placeholder') ||
      loweredUrl.includes('avatar')
    ) {
      return;
    }

    const titleMatches =
      normalizedTitle &&
      altText &&
      (altText.includes(normalizedTitle) || normalizedTitle.includes(altText) || altText.includes('foto'));

    const hostMatches =
      loweredUrl.includes('imovelweb') ||
      loweredUrl.includes('argenprop') ||
      loweredUrl.includes('navent');

    if (titleMatches || hostMatches) {
      values.add(currentSrc);
    }
  });

  return [...values].slice(0, 20);
}

function parseNetimoveisAddress(addressLine, breadcrumbs = {}) {
  const normalized = normalizeWhitespace(addressLine);
  const result = {
    addressLine: '',
    neighborhood: '',
    city: '',
    state: breadcrumbs?.state ? stateToAcronym(breadcrumbs.state) : '',
    postalCode: ''
  };

  if (!normalized) {
    return result;
  }

  const citySeparatorMatch = normalized.match(/^(.*?)\s*[–-]\s*(.*?)$/);
  const beforeCity = normalizeWhitespace(citySeparatorMatch?.[1] || normalized);
  const cityPart = normalizeWhitespace(citySeparatorMatch?.[2] || '');
  const beforeCityParts = beforeCity
    .split(',')
    .map(part => normalizeWhitespace(part))
    .filter(Boolean);

  result.addressLine = beforeCityParts[0] || '';
  result.neighborhood = capitalizeWords(beforeCityParts[1] || breadcrumbs?.neighborhood || '');
  result.city = capitalizeWords(cityPart || breadcrumbs?.city || '');

  if (!result.addressLine && result.neighborhood) {
    result.addressLine = `Regiao de ${result.neighborhood}`;
  }

  return result;
}

function collectNetimoveisGalleryImages() {
  const values = new Set();
  const propertyIdMatch = window.location.pathname.match(/\/(\d+)\/?$/);
  const propertyId = propertyIdMatch?.[1] || '';
  const similarListingsHeading = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, div, section, p, span, strong')]
    .find(node => normalizeForLookup(node.textContent || '').includes('imoveis semelhantes'));
  const imageNodes = [...document.querySelectorAll('img, picture source, a, div, section, figure, button, li, span, meta[property="og:image"], meta[name="twitter:image"]')];

  function looksLikeDirectImageUrl(url) {
    const loweredUrl = String(url || '').toLowerCase();

    if (!loweredUrl) {
      return false;
    }

    if (/\.(jpg|jpeg|png|webp|gif|avif)(?:[?#]|$)/i.test(loweredUrl)) {
      return true;
    }

    if (
      loweredUrl.includes('/fotos/') ||
      loweredUrl.includes('/images/') ||
      loweredUrl.includes('/image/') ||
      loweredUrl.includes('media.netimoveis') ||
      loweredUrl.includes('fotosimoveis.blob.core.windows.net') ||
      loweredUrl.includes('painel.netimoveis.com') ||
      loweredUrl.includes('thumb_foto') ||
      loweredUrl.includes('foto-imovel') ||
      loweredUrl.includes('cvcrm')
    ) {
      return true;
    }

    return false;
  }

  function extractStyleUrls(styleValue) {
    return String(styleValue || '')
      .match(/url\((['"]?)(.*?)\1\)/gi)
      ?.map(match => match.replace(/^url\((['"]?)/i, '').replace(/(['"]?)\)$/i, '')) || [];
  }

  function addCandidateUrl(url, hintText = '') {
    const normalizedUrl = normalizeImageUrl(url);
    if (!normalizedUrl) {
      return;
    }

    const loweredUrl = normalizedUrl.toLowerCase();
    const looksLikeSiteImage =
      loweredUrl.includes('netimoveis') ||
      loweredUrl.includes('fotosimoveis.blob.core.windows.net') ||
      loweredUrl.includes('painel.netimoveis.com') ||
      loweredUrl.includes('cvcrm') ||
      loweredUrl.includes('cloudfront') ||
      loweredUrl.includes('/fotos/') ||
      loweredUrl.includes('/images/') ||
      loweredUrl.includes('media.netimoveis');

    if (!looksLikeSiteImage) {
      return;
    }

    if (!looksLikeDirectImageUrl(loweredUrl)) {
      return;
    }

    if (
      loweredUrl.includes('logo') ||
      loweredUrl.includes('img.youtube.com') ||
      loweredUrl.includes('icon') ||
      loweredUrl.includes('avatar') ||
      loweredUrl.includes('sprite') ||
      loweredUrl.includes('thumb_foto_imovel') ||
      loweredUrl.includes('.html') ||
      loweredUrl.includes('/imovel/') ||
      loweredUrl.includes('javascript:')
    ) {
      return;
    }

    if (
      hintText.includes('thumb foto imovel') ||
      hintText.includes('video thumbnail') ||
      hintText.includes('whatsapp') ||
      hintText.includes('compartilhar') ||
      hintText.includes('mapa e regiao')
    ) {
      return;
    }

    if (propertyId && loweredUrl.includes('fotos-imoveis/')) {
      const expectedSegment = `/${propertyId}/`;
      if (!loweredUrl.includes(expectedSegment)) {
        return;
      }
    }

    values.add(normalizedUrl);
  }

  for (const node of imageNodes) {
    if (
      similarListingsHeading &&
      node !== similarListingsHeading &&
      Boolean(similarListingsHeading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)
    ) {
      continue;
    }

    const urls = [
      typeof node.currentSrc === 'string' ? node.currentSrc : '',
      typeof node.src === 'string' ? node.src : '',
      node.getAttribute?.('src'),
      node.getAttribute?.('data-src'),
      node.getAttribute?.('data-lazy-src'),
      node.getAttribute?.('data-original'),
      node.getAttribute?.('data-image'),
      node.getAttribute?.('data-image-url'),
      node.getAttribute?.('data-full'),
      node.getAttribute?.('data-zoom-image'),
      node.getAttribute?.('href'),
      node.getAttribute?.('content'),
      ...extractStyleUrls(node.getAttribute?.('style')),
      ...extractUrlsFromSrcset(node.getAttribute?.('srcset')),
      ...extractUrlsFromSrcset(node.getAttribute?.('data-srcset'))
    ];

    const hintText = normalizeForLookup([
      node.getAttribute?.('alt'),
      node.getAttribute?.('aria-label'),
      node.getAttribute?.('title'),
      node.getAttribute?.('data-caption'),
      node.parentElement?.textContent
    ].filter(Boolean).join(' '));

    for (const url of urls) {
      addCandidateUrl(url, hintText);
    }
  }

  const pageHtml = document.documentElement?.innerHTML || '';
  const scriptMatches = pageHtml.match(/https?:\/\/[^"'\\\s]+(?:painel\.netimoveis\.com|netimoveis|cvcrm|cloudfront)[^"'\\\s]+/gi) || [];
  for (const match of scriptMatches) {
    addCandidateUrl(match, '');
  }

  return [...values].slice(0, 45);
}

function extractNetimoveisDescription(pageText) {
  const match = String(pageText || '').match(/Mais sobre este im[oó]vel\s*\n([\s\S]+?)\n\s*Caracter[ií]sticas/i);
  if (!match?.[1]) {
    return '';
  }

  return match[1]
    .split('\n')
    .map(line => normalizeWhitespace(line))
    .filter(line => line && line !== '* * *')
    .join('\n\n')
    .trim();
}

function extractImovelwebDescription(pageText, title) {
  const normalizedTitle = normalizeWhitespace(title);
  if (!pageText || !normalizedTitle) {
    return '';
  }

  const escapedTitle = normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = pageText.match(new RegExp(`${escapedTitle}\\s*\\n([\\s\\S]+?)\\n\\s*Ler descri[cç][aã]o completa`, 'i'));

  if (match?.[1]) {
    return match[1]
      .split('\n')
      .map(part => normalizeWhitespace(part))
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  const fallbackMatch = pageText.match(/#\s*[^\n]+\n([\s\S]+?)\n\s*Como evitar fraudes/i);
  if (!fallbackMatch?.[1]) {
    return '';
  }

  return fallbackMatch[1]
    .split('\n')
    .map(part => normalizeWhitespace(part))
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function extractImovelwebBreadcrumbs(pageText) {
  const lines = String(pageText || '')
    .split('\n')
    .map(line => normalizeWhitespace(line))
    .filter(Boolean);

  const startIndex = lines.findIndex(line => normalizeForLookup(line) === 'imovelweb');
  if (startIndex < 0) {
    return {
      state: '',
      city: '',
      neighborhood: ''
    };
  }

  const trail = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const normalized = normalizeForLookup(line);

    if (
      !line ||
      normalized.startsWith('casa para ') ||
      normalized.startsWith('como evitar fraudes') ||
      normalized.startsWith('ver mais')
    ) {
      break;
    }

    trail.push(line);
  }

  const cleanedTrail = trail.filter(line => {
    const normalized = normalizeForLookup(line);
    return normalized !== 'casa' && normalized !== 'casas' && normalized !== 'alugar';
  });

  if (cleanedTrail.length >= 3) {
    return {
      state: cleanedTrail[0] || '',
      city: cleanedTrail[1] || '',
      neighborhood: cleanedTrail[2] || ''
    };
  }

  const stateNames = Object.keys(STATE_NAME_TO_ACRONYM);
  const stateIndex = lines.findIndex(line => stateNames.includes(normalizeForLookup(line)));

  if (stateIndex >= 0) {
    const city = lines[stateIndex + 1] || '';
    const neighborhood = lines[stateIndex + 2] || '';

    return {
      state: lines[stateIndex] || '',
      city,
      neighborhood
    };
  }

  return {
    state: '',
    city: '',
    neighborhood: ''
  };
}

function extractOlxDescription(pageText, title) {
  const normalizedTitle = String(title || '').trim();
  if (!pageText || !normalizedTitle) {
    return '';
  }

  const escapedTitle = normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = pageText.match(new RegExp(`${escapedTitle}\\s*\\n([\\s\\S]+?)\\n\\s*Localiza[cç][aã]o`, 'i'));

  if (!match?.[1]) {
    return '';
  }

  return match[1]
    .split('\n')
    .map(part => normalizeWhitespace(part))
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function extractOlxTitle(pageText) {
  const fromHeading = textFromSelectors(['h1', '[data-testid="ad-title"]']);
  if (fromHeading) {
    return fromHeading;
  }

  const fromPageText =
    pageText.match(/Mapa\s*\n\s*([^\n]+)/i)?.[1] ||
    pageText.match(/\n([^\n]+)\nCódigo do anúncio:/i)?.[1] ||
    '';

  return normalizeWhitespace(fromPageText);
}

function extractOlxPrice(pageText) {
  const fromSelector = textFromSelectors(['[data-testid="ad-price-container"]', '[data-testid="price-label"]']);
  if (fromSelector) {
    return parseCurrencyValue(fromSelector);
  }

  const labelAfterValue = pageText.match(/(R\$\s*[\d\.\,]+)\s*\n\s*Aluguel/i)?.[1];
  if (labelAfterValue) {
    return parseCurrencyValue(labelAfterValue);
  }

  const labelBeforeValue = pageText.match(/Aluguel\s*\n\s*(R\$\s*[\d\.\,]+)/i)?.[1];
  return parseCurrencyValue(labelBeforeValue || '');
}

function extractOlxCondoFee(pageText) {
  const labelBeforeValue = pageText.match(/Condom[ií]nio\s*\n\s*(R\$\s*[\d\.\,]+(?:\s*\/\s*m[eê]s)?)/i)?.[1];
  if (labelBeforeValue) {
    return parseCurrencyValue(labelBeforeValue);
  }

  const valueBeforeOtherText = pageText.match(/Condom[ií]nio[\s\S]{0,40}?(R\$\s*[\d\.\,]+(?:\s*\/\s*m[eê]s)?)/i)?.[1];
  return parseCurrencyValue(valueBeforeOtherText || '');
}

function extractPostalCodeFromText(pageText) {
  const match = String(pageText || '').match(/\b\d{5}-?\d{3}\b/);
  return match?.[0] || '';
}

function collectOlxGalleryImages(listingTitle) {
  const values = new Set();
  const normalizedTitle = normalizeForLookup(listingTitle);

  document.querySelectorAll('img').forEach(node => {
    const altText = normalizeForLookup(node.getAttribute('alt'));
    const currentSrc = normalizeImageUrl(node.currentSrc || node.src || node.getAttribute('src'));

    if (!currentSrc) {
      return;
    }

    const loweredUrl = currentSrc.toLowerCase();
    const isDecorative =
      loweredUrl.includes('logo') ||
      loweredUrl.includes('avatar') ||
      loweredUrl.includes('placeholder') ||
      loweredUrl.includes('icon');

    if (isDecorative) {
      return;
    }

    const looksLikeListingImage =
      altText.includes(normalizedTitle) ||
      altText.includes('foto') ||
      altText.includes('image') ||
      loweredUrl.includes('olx') ||
      loweredUrl.includes('image');

    if (!looksLikeListingImage) {
      return;
    }

    values.add(currentSrc);
  });

  return [...values].slice(0, 15);
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

  if (normalized.includes('sala') && normalized.includes('comercial')) {
    return 'Sala comercial';
  }

  return capitalizeWords(value);
}

function parseCurrencyValue(value) {
  if (!value && value !== 0) {
    return '';
  }

  const text = String(value).trim();
  const match = text.match(/R\$\s*([\d\.\,]+)/i);
  return match ? match[1].trim() : text;
}

function parseNumericCurrency(value) {
  const normalized = parseCurrencyValue(value);

  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function valueFromCandidates(...candidates) {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && String(candidate).trim() !== '') {
      return candidate;
    }
  }

  return '';
}

function normalizeCostLabel(value) {
  return normalizeForLookup(value).replace(/\s+/g, ' ').trim();
}

function extractLabelValueMap(sectionText) {
  const entries = String(sectionText || '')
    .split('\n')
    .map(line => normalizeWhitespace(line))
    .filter(Boolean);
  const map = {};

  for (let index = 0; index < entries.length - 1; index += 1) {
    const label = entries[index];
    const value = entries[index + 1];

    if (value?.match(/^R\$\s*[\d\.\,]+/i)) {
      map[normalizeCostLabel(label)] = parseCurrencyValue(value);
    }
  }

  return map;
}

function extractSectionByHeading(pageText, startHeading, stopHeading) {
  const lines = String(pageText || '').split('\n');
  const normalizedStart = normalizeForLookup(startHeading);
  const normalizedStop = normalizeForLookup(stopHeading);
  const section = [];
  let collecting = false;

  for (const line of lines) {
    const normalizedLine = normalizeForLookup(line.replace(/^#+\s*/, ''));

    if (!collecting && normalizedLine === normalizedStart) {
      collecting = true;
      continue;
    }

    if (collecting && normalizedLine === normalizedStop) {
      break;
    }

    if (collecting) {
      section.push(line);
    }
  }

  return section.join('\n').trim();
}

function extractCurrencyAfterLabel(pageText, labels) {
  const normalizedText = String(pageText || '');

  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*\\n\\s*(R\\$\\s*[\\d\\.\\,]+)`, 'i');
    const match = normalizedText.match(pattern);
    if (match?.[1]) {
      return parseCurrencyValue(match[1]);
    }
  }

  return '';
}

function extractQuintoAndarDescriptionFromPage() {
  const pageText = String(document.body?.innerText || '');
  const match = pageText.match(/Publicado[^\n]*\n([\s\S]+?)\nItens dispon[ií]veis/i);

  if (!match?.[1]) {
    return '';
  }

  return match[1]
    .split('\n')
    .map(part => String(part || '').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function extractQuintoAndarCostsFromPage() {
  const valuesSection = extractSectionByHeading(document.body?.innerText || '', 'Valores', 'Características do imóvel');
  const costMap = extractLabelValueMap(valuesSection);

  return {
    totalMonthlyCost: costMap[normalizeCostLabel('Total')] || '',
    price: costMap[normalizeCostLabel('Aluguel')] || '',
    condoFee: costMap[normalizeCostLabel('Condominio')] || costMap[normalizeCostLabel('Condomínio')] || '',
    iptu: costMap[normalizeCostLabel('IPTU')] || '',
    insurance: costMap[normalizeCostLabel('Seguro incendio')] || costMap[normalizeCostLabel('Seguro incêndio')] || '',
    serviceFee: costMap[normalizeCostLabel('Taxa de servico')] || costMap[normalizeCostLabel('Taxa de serviço')] || ''
  };
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
  const pageDescription = extractQuintoAndarDescriptionFromPage();
  const pageCosts = extractQuintoAndarCostsFromPage();

  draft.title =
    house?.name ||
    apartmentLd?.name ||
    metaTitle.replace(/\s*-\s*QuintoAndar\s*$/i, '').trim() ||
    pageTitle ||
    '';
  draft.category = house?.type || apartmentLd?.['@type'] || 'Apartamento';
  draft.price = valueFromCandidates(
    house?.rentPrice,
    house?.pricingInfos?.rent,
    house?.pricing?.rent,
    apartmentLd?.potentialAction?.price,
    pageCosts.price
  );
  draft.condoFee = valueFromCandidates(
    house?.pricingInfos?.condominium,
    house?.pricing?.condominium,
    house?.condominiumFee,
    pageCosts.condoFee
  );
  draft.iptu = valueFromCandidates(
    house?.pricingInfos?.iptu,
    house?.pricing?.iptu,
    pageCosts.iptu
  );
  draft.insurance = valueFromCandidates(
    house?.pricingInfos?.insurance,
    house?.pricing?.insurance,
    house?.pricingInfos?.fireInsurance,
    pageCosts.insurance
  );
  draft.serviceFee = valueFromCandidates(
    house?.pricingInfos?.serviceFee,
    house?.pricing?.serviceFee,
    house?.serviceFee,
    pageCosts.serviceFee
  );
  draft.totalMonthlyCost = valueFromCandidates(
    house?.pricingInfos?.total,
    house?.pricing?.total,
    house?.totalPrice,
    pageCosts.totalMonthlyCost
  );
  draft.description =
    pageDescription ||
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

  draft.price = parseCurrencyValue(draft.price);
  draft.condoFee = parseCurrencyValue(draft.condoFee);
  draft.iptu = parseCurrencyValue(draft.iptu);
  draft.insurance = parseCurrencyValue(draft.insurance);
  draft.serviceFee = parseCurrencyValue(draft.serviceFee);
  draft.totalMonthlyCost = parseCurrencyValue(draft.totalMonthlyCost);

  const totalMonthlyCost = parseNumericCurrency(draft.totalMonthlyCost);
  const knownCosts = [
    parseNumericCurrency(draft.price),
    parseNumericCurrency(draft.condoFee),
    parseNumericCurrency(draft.iptu),
    parseNumericCurrency(draft.insurance)
  ];

  if (!draft.serviceFee && totalMonthlyCost !== null && knownCosts.every(value => value !== null)) {
    const baseMonthlyCost = knownCosts.reduce((sum, value) => sum + (value || 0), 0);
    const derivedServiceFee = Number((totalMonthlyCost - baseMonthlyCost).toFixed(2));

    if (derivedServiceFee > 0) {
      draft.serviceFee = derivedServiceFee.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }

  return ensureDraftLocation(draft);
}

function extractFromVivaReal() {
  const draft = defaultDraft('VivaReal');
  const pageText = String(document.body?.innerText || '');
  const fromUrl = parseVivaRealLocationFromUrl();
  const locationSection = extractSectionByHeading(pageText, 'Localização', 'Valores');
  const valuesSection = extractSectionByHeading(pageText, 'Valores', 'Características do imóvel');
  const costsMap = extractLabelValueMap(valuesSection);
  const title =
    textFromSelectors(['h1', '[data-cy="listing-title"]']) ||
    textFromMeta('meta[property="og:title"]').replace(/\s*-\s*Viva Real\s*$/i, '').trim();
  const category =
    textFromSelectors(['[data-cy="listing-category"]']) ||
    pageText.match(/Para alugar\s*\n\s*([^\n]+)/i)?.[1] ||
    '';
  const address =
    textFromSelectors(['[data-cy="location-info-address"]', '[data-testid="address-info-value"]']) ||
    locationSection.split('\n').map(line => normalizeWhitespace(line)).find(Boolean) ||
    '';
  const description =
    textFromSelectors(['[data-testid="description"]', '[data-cy="description"]']) ||
    (pageText.match(/\((?:Código|CÃ³digo) do anunciante:[\s\S]+?\)\s*\n([\s\S]+?)\n\s*\(\d{2}\)\s*\d+/i)?.[1] || '')
      .split('\n')
      .map(part => part.trim())
      .filter(Boolean)
      .join('\n\n');
  const parsedAddress = parseVivaRealAddress(address);
  const fallbackNeighborhood = parsedAddress?.neighborhood || fromUrl?.neighborhood || '';
  const fallbackCity = parsedAddress?.city || fromUrl?.city || '';
  const fallbackState = parsedAddress?.state || (fallbackCity ? 'MG' : '');
  const fallbackAddressLine = parsedAddress?.addressLine || address || (fallbackNeighborhood ? `Regiao de ${fallbackNeighborhood}` : '');

  draft.title = title;
  draft.category = category;
  draft.price = costsMap[normalizeCostLabel('Aluguel')] || textFromSelectors(['[data-cy="price-info-value"]', '[data-testid="price-info-value"]']);
  draft.condoFee = costsMap[normalizeCostLabel('Condominio')] || costsMap[normalizeCostLabel('Condomínio')] || '';
  draft.iptu = costsMap[normalizeCostLabel('IPTU')] || '';
  draft.totalMonthlyCost = costsMap[normalizeCostLabel('Valor total previsto')] || '';
  draft.description = description;
  draft.location = {
    addressLine: fallbackAddressLine,
    neighborhood: fallbackNeighborhood,
    city: fallbackCity,
    state: fallbackState,
    postalCode: ''
  };
  draft.images = collectVivaRealGalleryImages(draft.title);

  draft.price = parseCurrencyValue(draft.price);
  draft.condoFee = parseCurrencyValue(draft.condoFee);
  draft.iptu = parseCurrencyValue(draft.iptu);
  draft.totalMonthlyCost = parseCurrencyValue(draft.totalMonthlyCost);

  return ensureDraftLocation(draft);
}

function extractFromZap() {
  const draft = defaultDraft('ZapImoveis');
  const pageText = String(document.body?.innerText || '');
  const jsonLdEntries = getJsonLdEntries();
  const apartmentLd = jsonLdEntries.find(entry =>
    entry?.['@type'] === 'Apartment' ||
    entry?.['@type'] === 'Residence' ||
    entry?.['@type'] === 'SingleFamilyResidence' ||
    entry?.['@type'] === 'Place'
  );
  const fromUrl = parseZapLocationFromUrl();
  const title =
    textFromSelectors(['h1', '[data-cy="listing-title"]']) ||
    textFromMeta('meta[property="og:title"]').replace(/\s*-\s*Zap Im[oó]veis\s*$/i, '').trim();
  const price =
    textFromSelectors(['[data-cy="price-info-value"]', '[data-testid="price-info-value"]']) ||
    extractCurrencyAfterLabel(pageText, ['Aluguel', 'Preco', 'Preço']);
  const condoFee = extractCurrencyAfterLabel(pageText, ['Condominio', 'Condomínio']);
  const iptu = extractCurrencyAfterLabel(pageText, ['IPTU']);
  const totalMonthlyCost = extractCurrencyAfterLabel(pageText, ['Valor total', 'Total', 'Total mensal']);
  const description =
    apartmentLd?.description ||
    textFromMeta('meta[property="og:description"]') ||
    textFromMeta('meta[name="description"]') ||
    textFromSelectors([
      '[data-testid="description"]',
      '[data-cy="description"]',
      '[class*="description"]',
      '[id*="description"]'
    ]) ||
    '';
  const address =
    textFromSelectors([
      '[data-cy="address-info"]',
      '[data-testid="address-info-value"]',
      '[data-cy="location-info-address"]'
    ]) ||
    '';
  const parsedAddress = parseZapAddress(address);
  const fallbackNeighborhood = parsedAddress?.neighborhood || fromUrl?.neighborhood || '';
  const fallbackCity = parsedAddress?.city || fromUrl?.city || '';
  const fallbackState = parsedAddress?.state || fromUrl?.state || '';
  const fallbackAddressLine =
    parsedAddress?.addressLine ||
    address ||
    (fallbackNeighborhood ? `Regiao de ${fallbackNeighborhood}` : (fallbackCity ? `Regiao central de ${fallbackCity}` : 'Endereco aproximado'));

  draft.title = title;
  draft.category =
    textFromSelectors(['[data-cy="listing-category"]']) ||
    apartmentLd?.['@type'] ||
    'Apartamento';
  draft.price = price;
  draft.condoFee = condoFee;
  draft.iptu = iptu;
  draft.totalMonthlyCost = totalMonthlyCost;
  draft.description = description;
  draft.originalUrl = textFromMeta('meta[property="og:url"]') || window.location.href;
  draft.pageUrl = window.location.href;
  draft.latitude = apartmentLd?.geo?.latitude ?? null;
  draft.longitude = apartmentLd?.geo?.longitude ?? null;
  draft.hasExactLocation = Boolean(draft.latitude !== null && draft.longitude !== null);
  draft.location = {
    addressLine: fallbackAddressLine,
    neighborhood: fallbackNeighborhood,
    city: fallbackCity,
    state: fallbackState,
    postalCode: ''
  };
  draft.images = Array.from(new Set(
    [
      ...(Array.isArray(apartmentLd?.image)
        ? apartmentLd.image
        : apartmentLd?.image
          ? [apartmentLd.image]
          : []),
      ...collectImageCandidates([
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'picture source',
        'img'
      ])
    ]
      .map(image => typeof image === 'string' ? image : image?.url || image?.contentUrl || '')
      .map(normalizeImageUrl)
      .filter(Boolean)
      .filter(url =>
        !url.includes('logo') &&
        !url.includes('placeholder') &&
        !url.includes('avatar') &&
        (
          url.includes('grupozap') ||
          url.includes('mediacdn') ||
          url.includes('resized') ||
          url.includes('cdn') ||
          url.includes('image') ||
          url.includes('foto')
        )
      )
  )).slice(0, 30);

  draft.price = parseCurrencyValue(draft.price);
  draft.condoFee = parseCurrencyValue(draft.condoFee);
  draft.iptu = parseCurrencyValue(draft.iptu);
  draft.totalMonthlyCost = parseCurrencyValue(draft.totalMonthlyCost);

  return ensureDraftLocation(draft);
}

function extractFromOlx() {
  const draft = defaultDraft('Olx');
  const pageText = String(document.body?.innerText || '');
  const fromUrl = parseOlxLocationFromUrl();
  const title = extractOlxTitle(pageText);
  const price = extractOlxPrice(pageText);
  const condoFee = extractOlxCondoFee(pageText);
  const locationLine =
    textFromSelectors(['[data-testid="location"]', '[aria-label="Localizacao"]']) ||
    (pageText.match(/Localiza[cç][aã]o\s*\n\s*([^\n]+)/i)?.[1] || '');
  const parsedLocation = parseOlxLocationLine(locationLine, fromUrl);
  const postalCode = extractPostalCodeFromText(pageText) || parsedLocation.postalCode || '';
  const description =
    extractOlxDescription(pageText, title) ||
    textFromSelectors(['[data-testid="ad-description"]', '#description-text']) ||
    textFromMeta('meta[property="og:description"]') ||
    '';

  draft.title = title;
  draft.category = normalizeCategory(title.split(' ').slice(0, 2).join(' ')) || 'Apartamento';
  draft.price = parseCurrencyValue(price);
  draft.condoFee = parseCurrencyValue(condoFee);
  draft.totalMonthlyCost = '';
  draft.description = description;
  draft.location = parsedLocation;
  draft.location.postalCode = postalCode;
  draft.images = collectOlxGalleryImages(title);

  return ensureDraftLocation(draft);
}

function extractFromImovelweb() {
  const draft = defaultDraft('Imovelweb');
  const pageText = String(document.body?.innerText || '');
  const jsonLdEntries = getJsonLdEntries();
  const fromUrl = parseImovelwebLocationFromUrl();
  const breadcrumbs = extractImovelwebBreadcrumbs(pageText);
  const listingLd = jsonLdEntries.find(entry =>
    entry?.['@type'] === 'House' ||
    entry?.['@type'] === 'SingleFamilyResidence' ||
    entry?.['@type'] === 'Residence' ||
    entry?.['@type'] === 'Offer' ||
    entry?.['@type'] === 'Product');
  const title =
    textFromSelectors(['h1']) ||
    textFromMeta('meta[property="og:title"]').replace(/\s*-\s*Imovelweb\s*$/i, '').trim() ||
    document.title.replace(/\s*-\s*Imovelweb\s*$/i, '').trim();
  const address =
    textFromSelectors(['h4']) ||
    pageText.match(/IPTU\s+R\$\s*[\d\.\,]+\s*\n+\s*([^\n]+)/i)?.[1] ||
    pageText.match(/####\s*([^\n]+)/i)?.[1] ||
    pageText.match(/aluguel\s+R\$\s*[\d\.\,]+\s*\n+\s*([^\n]+)/i)?.[1] ||
    '';
  const parsedAddress = parseImovelwebAddress(address, title);
  const category =
    textFromSelectors(['h2']) ||
    pageText.match(/##\s*([^\n·]+)/)?.[1] ||
    listingLd?.['@type'] ||
    title.split(' ').slice(0, 2).join(' ');
  const price =
    pageText.match(/aluguel\s+R\$\s*([\d\.\,]+)/i)?.[1] ||
    textFromMeta('meta[property="product:price:amount"]') ||
    '';
  const iptu =
    pageText.match(/IPTU[:\s]+R\$\s*([\d\.\,]+)/i)?.[1] ||
    '';
  const description =
    extractImovelwebDescription(pageText, title) ||
    listingLd?.description ||
    textFromMeta('meta[property="og:description"]') ||
    textFromMeta('meta[name="description"]');
  const neighborhoodFromBreadcrumbs =
    pageText.match(/\*\s*Contagem\s*\n\s*\*\s*([^\n]+)/i)?.[1] ||
    pageText.match(/\*\s*[A-Za-zÀ-ÿ\s]+\s*\n\s*\*\s*[A-Za-zÀ-ÿ\s]+\s*\n\s*\*\s*([^\n]+)\s*\n\s*\*\s*Casa para/i)?.[1] ||
    '';
  const cityFromBreadcrumbs =
    pageText.match(/\*\s*Imovelweb\s*\n\s*\*\s*Casas?\s*\n\s*\*\s*Alugar\s*\n\s*\*\s*[^\n]+\s*\n\s*\*\s*([^\n]+)/i)?.[1] ||
    '';
  const stateFromBreadcrumbs =
    pageText.match(/\*\s*Imovelweb\s*\n\s*\*\s*Casas?\s*\n\s*\*\s*Alugar\s*\n\s*\*\s*([^\n]+)/i)?.[1] ||
    '';

  draft.title = title;
  draft.category = normalizeCategory(category);
  draft.price = parseCurrencyValue(price);
  draft.iptu = parseCurrencyValue(iptu);
  draft.description = description;
  draft.originalUrl = textFromMeta('meta[property="og:url"]') || window.location.href;
  draft.pageUrl = window.location.href;
  draft.latitude = listingLd?.geo?.latitude ?? null;
  draft.longitude = listingLd?.geo?.longitude ?? null;
  draft.hasExactLocation = Boolean(draft.latitude !== null && draft.longitude !== null);
  draft.location = {
    addressLine: parsedAddress.addressLine || address || '',
    neighborhood: parsedAddress.neighborhood || normalizeWhitespace(breadcrumbs.neighborhood || neighborhoodFromBreadcrumbs) || fromUrl?.neighborhood || '',
    city: parsedAddress.city || capitalizeWords(breadcrumbs.city || cityFromBreadcrumbs),
    state: parsedAddress.state || stateToAcronym(breadcrumbs.state || stateFromBreadcrumbs),
    postalCode: ''
  };
  draft.images = collectImovelwebGalleryImages(draft.title);

  return ensureDraftLocation(draft);
}

function extractFromNetimoveis() {
  const draft = defaultDraft('Netimoveis');
  const pageText = String(document.body?.innerText || '');
  const breadcrumbs = {
    state: pageText.match(/Loca[cç][aã]o\s*\n\s*([^\n]+)\s*\n\s*Belo Horizonte/i)?.[1] || '',
    city: pageText.match(/Loca[cç][aã]o\s*\n\s*[^\n]+\s*\n\s*([^\n]+)\s*\n\s*Noroeste/i)?.[1] || '',
    neighborhood: pageText.match(/Noroeste\s*\n\s*([^\n]+)\s*\n\s*Apartamento/i)?.[1] || ''
  };
  const title =
    textFromSelectors(['h1']) ||
    pageText.match(/^#\s+([^\n]+)/m)?.[1] ||
    document.title.replace(/\s*-\s*\d+\s*$/i, '').trim();
  const addressLine =
    pageText.match(/por R\$\s*[\d\.\,]+\s*\n\s*([^\n]+)/i)?.[1] ||
    textFromSelectors(['h2', 'h3']) ||
    '';
  const parsedAddress = parseNetimoveisAddress(addressLine, breadcrumbs);
  const description = extractNetimoveisDescription(pageText);

  draft.title = title;
  draft.category = normalizeCategory(
    pageText.match(/Loca[cç][aã]o[\s\S]*?\n\s*([^\n]+)\s*\n\s*\d+/i)?.[1] ||
    title.split(' ').slice(0, 2).join(' ')
  );
  draft.price = extractCurrencyAfterLabel(pageText, ['Valor de locacao', 'Valor de locaçao', 'Valor de locação']);
  draft.condoFee = extractCurrencyAfterLabel(pageText, ['Condominio', 'Condomínio']);
  draft.iptu = extractCurrencyAfterLabel(pageText, ['IPTU']);
  draft.description = description;
  draft.originalUrl = textFromMeta('meta[property="og:url"]') || window.location.href;
  draft.pageUrl = window.location.href;
  draft.location = {
    addressLine: parsedAddress.addressLine,
    neighborhood: parsedAddress.neighborhood,
    city: parsedAddress.city || capitalizeWords(breadcrumbs.city),
    state: parsedAddress.state || stateToAcronym(breadcrumbs.state),
    postalCode: ''
  };
  draft.images = collectNetimoveisGalleryImages();

  draft.price = parseCurrencyValue(draft.price);
  draft.condoFee = parseCurrencyValue(draft.condoFee);
  draft.iptu = parseCurrencyValue(draft.iptu);

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

  if (host.includes('imovelweb.com.br')) {
    return extractFromImovelweb();
  }

  if (host.includes('netimoveis.com')) {
    return extractFromNetimoveis();
  }

  if (host.includes('olx.com.br')) {
    return extractFromOlx();
  }

  return null;
}
