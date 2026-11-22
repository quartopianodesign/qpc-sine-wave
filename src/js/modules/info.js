/**
 * Info — icona in alto a destra che apre una modale con il link al repo.
 *
 * Markup atteso:
 *   <div class="qpc-info">
 *     <button class="qpc-info__toggle">…</button>
 *     <dialog class="qpc-info__modal">…</dialog>
 *   </div>
 *
 * La modale è un <dialog> nativo: Esc e il tasto × la chiudono da soli.
 */
export function initInfo() {
  mos('.qpc-info', root => {
    mos('.qpc-info__modal', modal => {
      mos('.qpc-info__toggle', toggle => toggle.addEventListener('click', () => modal.showModal()), root);

      // click sul fondo, fuori dal riquadro: chiude
      modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

      // con la modale aperta tastiera e rotella restano alla modale
      ['keydown', 'wheel'].forEach(type => modal.addEventListener(type, e => e.stopPropagation()));
    }, root);
  });
}
