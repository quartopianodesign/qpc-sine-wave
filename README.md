# QPC Sine Wave

Le 2000 linee che girano dietro la hero del sito di [Quarto Piano Comunicazione](https://www.quartopianocomunicazione.it/), un componente WebGL "del lontano 2021", ancora online.
L'originale usava three.js e jQuery; qui è riscritto in WebGL2 diretto, senza librerie: lo stesso movimento, al pixel, con un modulo di circa 4 KB al posto dei circa 700 KB di three.js e jQuery.

- **Una sola draw call** per tutte le linee (instancing), al posto di 2000
- **Le rotazioni nello shader**: il JS a ogni frame aggiorna solo il tempo
- **Stessa velocità su ogni monitor**, anche a 120 Hz
- **Colore a scelta**, oppure `'rainbow'`: lo shader arcobaleno scritto nel 2021 e mai andato online

## Uso

```html
<div class="qpc-line-container"></div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    QPC.sineWave();                       // come sul sito: 2000 linee rosse
    // QPC.sineWave({ color: 'rainbow' }); // lo shader del 2021
  });
</script>
```

Il canvas prende le misure del contenitore: nella demo `.qpc-line-container` è fisso a tutta finestra, dietro la hero, con opacità 0.6 come sul sito.

`DOMContentLoaded` serve perché lo script inline viene letto prima dello script dell'utility (in `dist/` è `defer`, su CodePen `script.js` sta in fondo): così la chiamata parte quando `QPC` esiste già.

### Opzioni di `QPC.sineWave()`

Senza opzioni fa esattamente quello che fa il sito.

| Opzione | Default | |
| --- | --- | --- |
| `el` | primo `.qpc-line-container` | il contenitore del canvas |
| `count` | `2000` | numero di linee |
| `length` | `320` | lunghezza di ogni linea, in px |
| `gap` | `4` | distanza fra una linea e l'altra, in px |
| `twist` | `0.01` | rotazione in più di ogni linea rispetto alla precedente, in radianti |
| `speed` | `1` | moltiplicatore della velocità |
| `color` | `'#ff0000'` | colore esadecimale delle linee (`#rgb` o `#rrggbb`), oppure `'rainbow'` |

## Come funziona

- **La scena.** Ogni linea è un box 1×320×1, in fila lungo l'asse z ogni 4 px e ruotato di 0.01 radianti più del precedente. Le linee girano su x e z a 2.4 rad/s e su y a 0.8 rad/s, le pari in un verso e le dispari nell'altro; intanto la camera ortografica, in (30, 30, 30) e puntata sull'origine, ruota piano su x e z. È la stessa scena dell'originale.
- **Instancing.** Il box si carica una volta sola e si disegna `count` volte con `drawElementsInstanced`: ogni copia sa chi è da `gl_InstanceID`, e da lì ricava posizione e rotazione.
- **Tutto nello shader.** Le rotazioni delle linee e della camera sono funzioni del tempo: il vertex shader le calcola (Euler XYZ, come three.js) e il JS a ogni frame passa solo un numero. Nell'originale un ciclo JS ruotava 2000 oggetti a ogni frame.
- **Secondi, non frame.** L'originale aggiungeva 0.04 radianti a ogni frame, quindi su un monitor a 120 Hz girava il doppio più veloce. Qui la velocità è in radianti al secondo.
- **Misure del contenitore.** Un `ResizeObserver` adatta canvas e camera al contenitore; l'originale cambiava `camera.aspect`, che una camera ortografica non usa, e dopo un resize l'immagine si deformava. La risoluzione si ferma a 2× la densità dello schermo.
- **Movimento ridotto.** Con `prefers-reduced-motion` si disegna un solo fotogramma, fermo.

### Il bug del 2021, e il colore `'rainbow'`

Nel template del sito ci sono due shader scritti a mano, con un arcobaleno che si muove lungo le linee. Il JS li cercava con `$('#vertexShader').textContent`: nel template però avevano una `class` e non un `id`, e un oggetto jQuery non ha `.textContent`. Il valore arrivava `undefined`, three.js usava i suoi shader di default, e il default colora tutto di rosso pieno. Le linee rosse del sito sono quel default.

Qui il rosso resta come default, perché è quello che si vede da cinque anni; con `color: 'rainbow'` si accende lo shader del 2021, con le stesse uv del box di three.js.

### Verifica

Il codice originale con three.js r151 e questa riscrittura, fermati allo stesso istante (0, 3 e 7,5 secondi, e 3 secondi in rainbow), differiscono di meno di 50 pixel su un milione. Nel browser il JS di ogni frame passa da 2,2 ms a 0,06 ms.

## Struttura

```
src/
  index.html       template unico della pagina: la hero della demo
  js/app.js        entry: API window.QPC + helper mos() + initCode()
  js/modules/      sine-wave.js (WebGL2 e shader), info.js (icona info + modale con il link al repo)
  scss/style.scss  entry: @use di abstracts e components
  scss/abstracts/  _variables (colori del tema 2021), _css-variables (colori della modale), _reset
  scss/components/ un parziale per blocco: _qpc-line-container, _qpc-hero, _qpc-info
dist/              build del sito (generata, non nel repo)
codepen/           build per CodePen (generata, non nel repo)
```

## Comandi

```bash
npm install
npm run dev     # watch + BrowserSync su localhost:3000 (serve dist/)
npm run build   # dist/ (minificato) + codepen/ (leggibile)
```

## CodePen

`dist/` e `codepen/` non sono nel repo: si generano con `npm install && npm run build`.

`codepen/` contiene i tre file del pen, pronti per CodePen 2.0 o per essere copiati così come sono:

| File | Contenuto |
| --- | --- |
| `index.html` | documento completo: font, `style.css`, markup, chiamata all'API, `script.js` |
| `style.css` | CSS leggibile, compilato da `src/scss/style.scss` |
| `script.js` | JS leggibile, senza runtime di webpack |

## Licenza

Codice MIT. Il logo è parte dell'identità di Quarto Piano Comunicazione. Font: IBM Plex Sans (SIL Open Font License), da Google Fonts.
