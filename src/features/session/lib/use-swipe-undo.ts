import { useRef, useState } from "react";

const UNDO_LIMIT = 5;

export function useSwipeUndo() {
  const [stack, setStack] = useState<number[]>([]);
  const stackRef = useRef<number[]>([]);

  function record(index: number) {
    const next = [...stackRef.current, index].slice(-UNDO_LIMIT);
    stackRef.current = next;
    setStack(next);
  }

  function back(): number | null {
    const current = stackRef.current;
    if (current.length === 0) return null;
    const prev = current[current.length - 1];
    const next = current.slice(0, -1);
    stackRef.current = next;
    setStack(next);
    return prev;
  }

  return {
    undoCount: stack.length,
    canUndo: stack.length > 0,
    record,
    back,
  };
}
