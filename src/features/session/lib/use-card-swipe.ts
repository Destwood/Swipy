import {
  useCallback,
  useRef,
  useState,
  type PointerEvent,
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
  const draggingRef = useRef(false);
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
    liveX.current = 0;
  }

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!input.enabled || e.button !== 0) return;
      draggingRef.current = true;
      originX.current = e.clientX;
      liveX.current = 0;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [input.enabled],
  );

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const x = e.clientX - originX.current;
    liveX.current = x;
    setOffset(x);
  }, []);

  const finish = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
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
  }, []);

  const decision: Decision =
    offset > 72 ? "like" : offset < -72 ? "dislike" : null;

  return {
    offset,
    dragging,
    decision,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
    },
  };
}
