import { useEffect, useRef } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

interface ShortcutOptions {
  enabled?: boolean;
  allowInInputs?: boolean;
}

/** Fires `handler` when `key` (e.g. "/", "n", "Escape") is pressed, ignoring
 * keystrokes while the user is typing in a form field (unless allowInInputs). */
export function useKeyboardShortcut(key: string, handler: () => void, options: ShortcutOptions = {}): void {
  const { enabled = true, allowInInputs = false } = options;
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!allowInInputs && isTypingTarget(event.target) && key !== "Escape") return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      event.preventDefault();
      handlerRef.current();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, enabled, allowInInputs]);
}

/** Fires `handler` when the two keys are pressed in sequence within `timeoutMs`. */
export function useKeySequence(keys: [string, string], handler: () => void, options: ShortcutOptions = {}): void {
  const { enabled = true } = options;
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  const firstPressedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const pressed = event.key.toLowerCase();
      const now = Date.now();

      if (pressed === keys[0].toLowerCase()) {
        firstPressedAt.current = now;
        return;
      }

      if (pressed === keys[1].toLowerCase() && firstPressedAt.current && now - firstPressedAt.current < 800) {
        firstPressedAt.current = null;
        event.preventDefault();
        handlerRef.current();
        return;
      }

      firstPressedAt.current = null;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keys, enabled]);
}
