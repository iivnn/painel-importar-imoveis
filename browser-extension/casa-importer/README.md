# Casa Importador

Casca inicial da extensao Chrome para importar anuncios para o sistema Casa.

## Estrutura

- `manifest.json`: configuracao principal da extensao
- `src/background.js`: conversa com a API local
- `src/content/`: leitura dos dados da pagina de anuncio
- `src/popup/`: interface rapida ao clicar no icone da extensao
- `src/options/`: configuracoes da API local
- `src/shared/`: utilitarios comuns

## Como carregar no Chrome

1. Abra `chrome://extensions`
2. Ative `Modo do desenvolvedor`
3. Clique em `Carregar sem compactacao`
4. Selecione a pasta:

`C:\Users\iivan\OneDrive\Documentos\Casa\browser-extension\casa-importer`

## Fluxo atual

1. Abrir um anuncio em site suportado
2. Clicar na extensao
3. Clicar em `Ler pagina`
4. Revisar a pre-visualizacao
5. Clicar em `Importar`

## Sites previstos na casca

- QuintoAndar
- VivaReal
- ZapImoveis
- OLX

## Observacao

Os extratores ainda estao em modo inicial e usam seletores simples. O proximo passo natural e refinar os extratores por site e adicionar upload de imagens para o backend local.
