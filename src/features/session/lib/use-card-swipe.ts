import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";

const COMMIT_PX = 108;
const FLY_PX = 460;

type Decision = "like" | "dislike" | null;

export function useCardSwipe(input: {
  enabled: boolean;
  cardId: string;
  onLike: () => void;
  onSkip: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [seenId, setSeenId] = useState(input.cardId);
  const layerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const originX = useRef(0);
  const liveX = useRef(0);
  const onLikeRef = useRef(input.onLike);
  const onSkipRef = useRef(input.onSkip);
  onLikeRef.current = input.onLike;
  onSkipRef.current = input.onSkip;

  if (seenId !== input.cardId) {
    setSeenId(input.cardId);
    setOffset(0);
    setDragging(false);
    draggingRef.current = false;
    pointerIdRef.current = null;
    liveX.current = 0;
  }

  const releaseCapture = useCallback(() => {
    const el = layerRef.current;
    const pointerId = pointerIdRef.current;
    if (!el || pointerId == null) return;
    try {
      if (el.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const finish = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    releaseCapture();
    pointerIdRef.current = null;
    setDragging(false);
    const x = liveX.current;
    liveX.current = 0;
    if (x > COMMIT_PX) {
      setOffset(FLY_PX);
      onLikeRef.current();
    } else if (x < -COMMIT_PX) {
      setOffset(-FLY_PX);
      onSkipRef.current();
    } else {
      setOffset(0);
    }
  }, [releaseCapture]);

  const onPointerMove = useCallback((clientX: number) => {
    if (!draggingRef.current) return;
    const x = clientX - originX.current;
    liveX.current = x;
    setOffset(x);
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!input.enabled || e.button !== 0) return;
      e.preventDefault();
      draggingRef.current = true;
      pointerIdRef.current = e.pointerId;
      originX.current = e.clientX;
      liveX.current = 0;
      setDragging(true);
      setOffset(0);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [input.enabled],
  );

  const onLayerPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) {
        return;
      }
      onPointerMove(e.clientX);
    },
    [onPointerMove],
  );

  useEffect(() => {
    if (!dragging) return;

    const onWindowPointerMove = (e: globalThis.PointerEvent) => {
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) {
        return;
      }
      onPointerMove(e.clientX);
    };

    const onWindowPointerEnd = () => {
      finish();
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);
    window.addEventListener("mouseup", onWindowPointerEnd);
    window.addEventListener("blur", onWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
      window.removeEventListener("mouseup", onWindowPointerEnd);
      window.removeEventListener("blur", onWindowPointerEnd);
    };
  }, [dragging, finish, onPointerMove]);

  const decision: Decision =
    offset > 72 ? "like" : offset < -72 ? "dislike" : null;

  return {
    offset,
    dragging,
    decision,
    layerRef: layerRef as RefObject<HTMLDivElement>,
    bind: {
      onPointerDown,
      onPointerMove: onLayerPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
    },
  };
}
