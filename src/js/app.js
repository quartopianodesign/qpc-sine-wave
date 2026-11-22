/**
 * QPC Sine Wave — entry point
 */
import { sineWave } from './modules/sine-wave.js';
import { initInfo } from './modules/info.js';

/**
 * API pubblica
 *
 * @example
 * QPC.sineWave();                      // come sul sito: 2000 linee rosse
 * QPC.sineWave({ color: 'rainbow' });  // lo shader del 2021
 */
window.QPC = { sineWave };

/**
 * Funzione helper globale per il DOM
 * Permette iterazione facile sugli elementi DOM
 *
 * @param {string|Element} selectorOrElement - Selettore CSS o elemento DOM
 * @param {Function} callback - Funzione da eseguire su ogni elemento (riceve el, index)
 * @param {Element} [context=document] - Contesto in cui cercare (opzionale)
 *
 * @example
 * mos('.my-class', el => el.classList.add('active'));
 * mos('.my-class', (el, index) => console.log(index, el));
 * mos('.child', el => console.log(el), parentElement);
 */
window.mos = function (selectorOrElement, callback, context = document) {
  let elements = [];

  if (typeof selectorOrElement === 'string') {
    elements = context.querySelectorAll(selectorOrElement);
  } else if (selectorOrElement instanceof Element || selectorOrElement === document) {
    elements = [selectorOrElement];
  } else {
    return;
  }

  if (typeof callback !== 'function') {
    return;
  }

  elements.forEach((el, index) => callback(el, index));
};

/**
 * DOM Ready handler
 */
document.addEventListener('DOMContentLoaded', () => {

  /**
   * Initialize multiple functions sequentially
   * @param {Function[]} functions - Array of functions to execute
   */
  function initCode(functions) {
    functions.forEach(fn => {
      try { fn(); } catch (e) { console.warn('[QPC] Init error in', fn.name || 'anonymous', e); }
    });
  }

  initCode([initInfo]);
});
