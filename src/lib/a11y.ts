import type { KeyboardEvent } from "react";

/**
 * Props that make a non-interactive element (usually a card or row) behave
 * like a button for keyboard and screen-reader users.
 *
 * Use instead of a bare `onClick` on a `<div>`:
 *
 *   <div {...clickableProps(() => open(id))} className="cursor-pointer …">
 *
 * Keep the element a `<div>` (not a `<button>`) when it contains other
 * interactive controls — nesting buttons is invalid HTML.
 */
export function clickableProps(onActivate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        // Space would otherwise scroll the page.
        event.preventDefault();
        onActivate();
      }
    },
  };
}