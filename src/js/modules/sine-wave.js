/**
 * QPC Sine Wave — le linee in rotazione della hero di Quarto Piano (2021).
 *
 * Markup atteso:
 *   <div class="qpc-line-container"></div>
 *
 * Ogni linea è un box 1×length×1 in fila lungo l'asse z, ruotato un po' più
 * della precedente (twist): ruotando tutte insieme disegnano l'onda.
 *
 * L'originale usava three.js con una mesh per linea (2000 draw call) e un ciclo
 * JS che ne aggiornava le rotazioni a ogni frame. Qui è WebGL2 diretto: una sola
 * geometria disegnata count volte (instancing), e tutte le rotazioni, delle
 * linee e della camera, si calcolano nello shader a partire dal tempo.
 */

const VERTEX = `#version 300 es
in vec3 position;
in vec2 uv;
uniform float uTime, uGap, uTwist, uCount;
uniform vec2 uSize;
out vec2 vUv;

// Euler XYZ come in three.js: Rx * Ry * Rz
mat3 rotXYZ(vec3 e) {
  vec3 c = cos(e), s = sin(e);
  return mat3(1, 0, 0, 0, c.x, s.x, 0, -s.x, c.x)
       * mat3(c.y, 0, -s.y, 0, 1, 0, s.y, 0, c.y)
       * mat3(c.z, s.z, 0, -s.z, c.z, 0, 0, 0, 1);
}

void main() {
  float i = float(gl_InstanceID), t = uTime;

  // la linea: x e z girano a 2.4 rad/s (0.04 a frame a 60 fps nell'originale),
  // y a 0.8 rad/s, in un verso le pari e nell'altro le dispari
  vec3 turn = vec3(2.4 * t, (mod(i, 2.) == 1. ? .8 : -.8) * t, i * uTwist + 2.4 * t);
  vec3 p = rotXYZ(turn) * position + vec3(0, 0, (i - uCount / 2.) * uGap);

  // la camera: ortografica in (30, 30, 30) puntata sull'origine, poi gira piano su x e z
  vec3 cam = vec3(-.7853982 - .1 * t, .6154797, .5235988 - .1 * t);
  vec3 v = transpose(rotXYZ(cam)) * (p - 30.);

  gl_Position = vec4(2. * v.xy / uSize, -v.z / 5000., 1);
  vUv = uv;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform vec3 uColor;
uniform bool uRainbow;
uniform float uTime;
out vec4 color;

void main() {
  // rainbow: lo shader scritto nel 2021, mai andato online
  vec2 p = 3. * vUv;
  color = uRainbow
    ? vec4(abs(sin(p.x * p.y + (1. + 5. * uTime) / vec3(5, 4, 3))), 1)
    : vec4(uColor, 1);
}`;

// il box di three.js (BoxGeometry), stesse facce e stesse uv: lo shader rainbow le usa
function box(w, h, d) {
  const pos = [], uv = [], idx = [];
  [['z', 'y', 'x', -1, -1, d, h, w], ['z', 'y', 'x', 1, -1, d, h, -w],
   ['x', 'z', 'y', 1, 1, w, d, h], ['x', 'z', 'y', 1, -1, w, d, -h],
   ['x', 'y', 'z', 1, -1, w, h, d], ['x', 'y', 'z', -1, -1, w, h, -d]]
    .forEach(([u, v, n, du, dv, fw, fh, fd], f) => {
      for (let iy = 0; iy < 2; iy++) for (let ix = 0; ix < 2; ix++) {
        const p = {};
        p[u] = (ix - .5) * fw * du;
        p[v] = (iy - .5) * fh * dv;
        p[n] = fd / 2;
        pos.push(p.x, p.y, p.z);
        uv.push(ix, 1 - iy);
      }
      const o = f * 4;
      idx.push(o, o + 2, o + 1, o + 2, o + 3, o + 1);
    });
  return { pos, uv, idx };
}

/**
 * Monta l'onda di linee
 * @param {Object} [opts]
 * @param {Element} [opts.el] - .qpc-line-container (default: il primo della pagina)
 * @param {number} [opts.count=2000] - numero di linee
 * @param {number} [opts.length=320] - lunghezza di ogni linea, in px
 * @param {number} [opts.gap=4] - distanza fra una linea e l'altra, in px
 * @param {number} [opts.twist=0.01] - rotazione in più di ogni linea rispetto alla precedente, in radianti
 * @param {number} [opts.speed=1] - moltiplicatore della velocità
 * @param {string} [opts.color='#ff0000'] - colore esadecimale delle linee, oppure 'rainbow'
 * @returns {Element|undefined} el, o niente se il browser non ha WebGL2
 */
export function sineWave({ el, count = 2000, length = 320, gap = 4, twist = 0.01, speed = 1, color = '#ff0000' } = {}) {
  if (!el) mos('.qpc-line-container', c => { el ||= c; });

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) return console.warn('[QPC] sineWave: WebGL2 non disponibile');
  el.appendChild(canvas);

  const program = gl.createProgram();
  [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]].forEach(([type, src]) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  });
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return console.warn('[QPC] sineWave:', gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const { pos, uv, idx } = box(1, length, 1);
  const attribute = (name, data, size) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  attribute('position', pos, 3);
  attribute('uv', uv, 2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

  const u = name => gl.getUniformLocation(program, name);
  const rainbow = color === 'rainbow';
  const hex = rainbow ? '000000' : color.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3');
  gl.uniform3fv(u('uColor'), [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255));
  gl.uniform1i(u('uRainbow'), rainbow);
  gl.uniform1f(u('uGap'), gap);
  gl.uniform1f(u('uTwist'), twist);
  gl.uniform1f(u('uCount'), count);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STILL = 2; // con il movimento ridotto: un fotogramma fermo, a 2 secondi
  const start = performance.now();
  let time = 0;

  function draw() {
    gl.uniform1f(u('uTime'), time);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElementsInstanced(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0, count);
  }

  // il canvas prende le misure del contenitore, non della finestra;
  // la risoluzione si ferma a 2× per non pesare sugli schermi molto densi
  new ResizeObserver(([{ contentRect: { width, height } }]) => {
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u('uSize'), width, height);
    draw();
  }).observe(el);

  // in secondi e non a frame: la stessa velocità su ogni monitor;
  // con il movimento ridotto il ciclo si ferma al primo fotogramma
  requestAnimationFrame(function frame(now) {
    time = rm.matches ? STILL : (now - start) / 1000 * speed;
    draw();
    if (!rm.matches) requestAnimationFrame(frame);
  });

  return el;
}
