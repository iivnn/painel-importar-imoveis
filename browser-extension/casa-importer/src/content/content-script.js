chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'extract-listing') {
    return false;
  }

  try {
    const draft = extractCurrentListing();

    if (!draft) {
      sendResponse({
        ok: false,
        error: 'Este site ainda nao possui um extrator configurado.'
      });

      return false;
    }

    sendResponse({
      ok: true,
      draft
    });
  } catch (error) {
    sendResponse({
      ok: false,
      error: error?.message || 'Falha ao ler os dados da pagina.'
    });
  }

  return false;
});
