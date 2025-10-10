let count = 0;
const ROOT = () => document.documentElement;

export function modalOpen() {
  try { if (++count > 0) ROOT().classList.add('has-modal-open'); } catch {}
}
export function modalClose() {
  try { if (count > 0 && --count === 0) ROOT().classList.remove('has-modal-open'); } catch {}
}
export function isAnyModalOpen() {
  try { return ROOT().classList.contains('has-modal-open'); } catch { return false; }
}
