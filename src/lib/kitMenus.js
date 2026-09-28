// The chat kit's "…" menu (its header folds the actions into one below 520px)
// only closes when focus leaves it. Two ways that fails, both on a phone:
//
// - Tapping "…" again. The press moves focus from the menu to the button, the
//   menu closes on that blur, and the click that follows toggles it open again.
// - Tapping anywhere else. A tap on something that cannot take focus moves no
//   focus on iOS, so there is no blur and the menu stays.
//
// Until the kit closes it itself (reported in docs/kit-issues.md), this does:
// the press on an open "…" keeps focus where it is, so the click just closes it,
// and a press outside an open menu presses "…" for the person.

const OPEN = '[aria-haspopup="menu"][aria-expanded="true"]';

export function closeKitMenusOnOutsidePress() {
  const onPointerDown = (e) => {
    const toggle = document.querySelector(OPEN);
    if (!toggle) return;
    const menu = document.getElementById(toggle.getAttribute('aria-controls'));
    if (toggle.contains(e.target)) {
      e.preventDefault(); // no focus move, so no blur: the click alone closes it
      return;
    }
    if (menu?.contains(e.target)) return;
    toggle.click();
  };
  const onMouseDown = (e) => {
    // pointerdown's preventDefault does not stop the focus change; mousedown's does
    const toggle = document.querySelector(OPEN);
    if (toggle?.contains(e.target)) e.preventDefault();
  };
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('mousedown', onMouseDown, true);
}
