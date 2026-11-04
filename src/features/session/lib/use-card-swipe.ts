import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";

const COMMIT_PX = 108;
/** Cap live drag so release never animates from extreme off-screen offsets. */
const MAX_DRAG_PX = 420;

type Decision = "like" | "dislike" | null;

export type SwipeValue = Exclude<Decision, null>;
export type SwipeResult = boolean | void;

export function useCardSwipe(input: {
  enabled: boolean;
  cardId: string;
  onLike: () => SwipeResult;
  onSkip: () => SwipeResult;
  onLaunch?: (value: SwipeValue, fromOffset: number) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [instant, setInstant] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const originX = useRef(0);
  const liveX = useRef(0);
  const onLikeRef = useRef(input.onLike);
  const onSkipRef = useRef(input.onSkip);
  const onLaunchRef = useRef(input.onLaunch);
  onLikeRef.current = input.onLike;
  onSkipRef.current = input.onSkip;
  onLaunchRef.current = input.onLaunch;

  useEffect(() => {
    setOffset(0);
    setDragging(false);
    setInstant(true);
    draggingRef.current = false;
    pointerIdRef.current = null;
    liveX.current = 0;
    const frame = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(frame);
  }, [input.cardId]);

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

  const run = useCallback((value: SwipeValue, fromOffset: number) => {
    const accepted =
      value === "like" ? onLikeRef.current() : onSkipRef.current();
    if (accepted === false) {
      setOffset(0);
      return;
    }
    onLaunchRef.current?.(value, fromOffset);
    setInstant(true);
    setOffset(0);
    requestAnimationFrame(() => setInstant(false));
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
      run("like", x);
      return;
    }

    if (x < -COMMIT_PX) {
      run("dislike", x);
      return;
    }

    setOffset(0);
  }, [releaseCapture, run]);

  const commit = useCallback(
    (value: SwipeValue) => {
      if (!input.enabled || draggingRef.current) return;
      run(value, 0);
    },
    [input.enabled, run],
  );

  const onPointerMove = useCallback((clientX: number) => {
    if (!draggingRef.current) return;
    const raw = clientX - originX.current;
    const x = Math.max(-MAX_DRAG_PX, Math.min(MAX_DRAG_PX, raw));
    liveX.current = x;
    setOffset(x);
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!input.enabled || e.button !== 0) return;
      setInstant(false);
      e.preventDefault();
      const restX = new DOMMatrix(getComputedStyle(e.currentTarget).transform)
        .m41;
      draggingRef.current = true;
      pointerIdRef.current = e.pointerId;
      originX.current = e.clientX - restX;
      liveX.current = restX;
      setDragging(true);
      setOffset(restX);
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

  const decision: Decision =
    offset > 72 ? "like" : offset < -72 ? "dislike" : null;

  return {
    offset,
    dragging,
    instant,
    decision,
    commit,
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
