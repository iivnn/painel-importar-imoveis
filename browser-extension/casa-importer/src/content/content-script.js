chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'extract-listing') {
    return false;
  }

  try {
    const draft = extractCurrentListing();

    if (!draft) {
      void chrome.runtime.sendMessage({
        type: 'write-log',
        payload: {
          level: 'Warning',
          category: 'Extracao',
          eventName: 'ExtractorNotFound',
          message: 'Nao existe extrator configurado para a pagina atual.',
          details: {
            pageUrl: window.location.href
          },
          path: window.location.href
        }
      });

      sendResponse({
        ok: false,
        error: 'Este site ainda nao possui um extrator configurado.'
      });

      return false;
    }

    void chrome.runtime.sendMessage({
      type: 'write-log',
      payload: {
        level: 'Info',
        category: 'Extracao',
        eventName: 'ExtractionSucceeded',
        message: 'Os dados da pagina foram extraidos pelo content script.',
        details: {
          pageUrl: window.location.href,
          title: draft.title || '',
          source: draft.source || '',
          imageCount: Array.isArray(draft.images) ? draft.images.length : 0
        },
        path: window.location.href
      }
    });

    sendResponse({
      ok: true,
      draft
    });
  } catch (error) {
    void chrome.runtime.sendMessage({
      type: 'write-log',
      payload: {
        level: 'Error',
        category: 'Extracao',
        eventName: 'ExtractionFailed',
        message: error?.message || 'Falha ao ler os dados da pagina.',
        details: {
          pageUrl: window.location.href
        },
        path: window.location.href
      }
    });

    sendResponse({
      ok: false,
      error: error?.message || 'Falha ao ler os dados da pagina.'
    });
  }

  return false;
});
