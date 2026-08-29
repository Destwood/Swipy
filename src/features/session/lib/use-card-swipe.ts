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
const FLY_MS = 220;
/** Cap live drag so release never animates from extreme off-screen offsets. */
const MAX_DRAG_PX = 420;

type Decision = "like" | "dislike" | null;

export function useCardSwipe(input: {
  enabled: boolean;
  cardId: string;
  onLike: () => void;
  onSkip: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [instant, setInstant] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const committingRef = useRef(false);
  const flyTimerRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const originX = useRef(0);
  const liveX = useRef(0);
  const onLikeRef = useRef(input.onLike);
  const onSkipRef = useRef(input.onSkip);
  onLikeRef.current = input.onLike;
  onSkipRef.current = input.onSkip;

  const clearFlyTimer = useCallback(() => {
    if (flyTimerRef.current != null) {
      window.clearTimeout(flyTimerRef.current);
      flyTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    setDragging(false);
    setCommitting(false);
    setInstant(true);
    draggingRef.current = false;
    committingRef.current = false;
    pointerIdRef.current = null;
    liveX.current = 0;
    clearFlyTimer();
    const frame = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(frame);
  }, [input.cardId, clearFlyTimer]);

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
    if (!draggingRef.current || committingRef.current) return;
    draggingRef.current = false;
    releaseCapture();
    pointerIdRef.current = null;
    setDragging(false);
    const x = liveX.current;
    liveX.current = 0;

    if (x > COMMIT_PX) {
      committingRef.current = true;
      setCommitting(true);
      setOffset(FLY_PX);
      clearFlyTimer();
      flyTimerRef.current = window.setTimeout(() => {
        flyTimerRef.current = null;
        committingRef.current = false;
        setCommitting(false);
        setInstant(true);
        setOffset(0);
        onLikeRef.current();
        requestAnimationFrame(() => setInstant(false));
      }, FLY_MS);
      return;
    }

    if (x < -COMMIT_PX) {
      committingRef.current = true;
      setCommitting(true);
      setOffset(-FLY_PX);
      clearFlyTimer();
      flyTimerRef.current = window.setTimeout(() => {
        flyTimerRef.current = null;
        committingRef.current = false;
        setCommitting(false);
        setInstant(true);
        setOffset(0);
        onSkipRef.current();
        requestAnimationFrame(() => setInstant(false));
      }, FLY_MS);
      return;
    }

    setOffset(0);
  }, [clearFlyTimer, releaseCapture]);

  const onPointerMove = useCallback((clientX: number) => {
    if (!draggingRef.current) return;
    const raw = clientX - originX.current;
    const x = Math.max(-MAX_DRAG_PX, Math.min(MAX_DRAG_PX, raw));
    liveX.current = x;
    setOffset(x);
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!input.enabled || committingRef.current || e.button !== 0) return;
      clearFlyTimer();
      committingRef.current = false;
      setCommitting(false);
      setInstant(false);
      e.preventDefault();
      draggingRef.current = true;
      pointerIdRef.current = e.pointerId;
      originX.current = e.clientX;
      liveX.current = 0;
      setDragging(true);
      setOffset(0);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [clearFlyTimer, input.enabled],
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

    const onWindowPointerEnd = (e: globalThis.PointerEvent) => {
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) {
        return;
      }
      finish();
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
    };
  }, [dragging, finish, onPointerMove]);

  useEffect(() => () => clearFlyTimer(), [clearFlyTimer]);

  const decision: Decision =
    offset > 72 ? "like" : offset < -72 ? "dislike" : null;

  return {
    offset,
    dragging,
    committing,
    instant,
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
