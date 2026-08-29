type ToastItem = {
  id: number;
  message: string;
};

type Listener = (items: ToastItem[]) => void;

const MAX_TOASTS = 3;

let seq = 0;
let items: ToastItem[] = [];
const timeouts = new Map<number, number>();
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(items);
}

function clearToastTimeout(id: number) {
  const timeoutId = timeouts.get(id);
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    timeouts.delete(id);
  }
}

function dismissToast(id: number) {
  clearToastTimeout(id);
  items = items.filter((item) => item.id !== id);
  emit();
}

export function toast(message: string, durationMs = 2400) {
  const id = ++seq;
  items = [...items, { id, message }];
  while (items.length > MAX_TOASTS) {
    const [oldest] = items;
    clearToastTimeout(oldest.id);
    items = items.slice(1);
  }
  emit();
  timeouts.set(
    id,
    window.setTimeout(() => dismissToast(id), durationMs),
  );
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}
