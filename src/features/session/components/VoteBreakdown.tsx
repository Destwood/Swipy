"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GameVoter } from "@/features/session/lib/match-results";
import { MemberAvatar } from "./MemberAvatar";
import styles from "./VoteBreakdown.module.css";

const SHOW_DELAY_MS = 140;
const HIDE_DELAY_MS = 160;
const STACK_MAX = 5;

type Props = {
  voters: GameVoter[];
  likes: number;
  members: number;
};

function canHoverTip() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function VoteBreakdown({ voters, likes, members }: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef(0);
  const hideTimer = useRef(0);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const liked = voters.filter((v) => v.vote === "like");
  const skipped = voters.filter((v) => v.vote === "dislike");
  const waiting = voters.filter((v) => v.vote == null);
  const stack = [...liked, ...skipped, ...waiting].slice(0, STACK_MAX);
  const overflow = Math.max(0, voters.length - stack.length);
  const hasTip = voters.length > 0;

  const clearTimers = useCallback(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
  }, []);

  const scheduleShow = useCallback(() => {
    if (!hasTip || !canHoverTip()) return;
    clearTimers();
    showTimer.current = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
  }, [clearTimers, hasTip]);

  const scheduleHide = useCallback(() => {
    clearTimers();
    hideTimer.current = window.setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const card = cardRef.current;
    if (!anchor || !card) return;
    const rect = anchor.getBoundingClientRect();
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const pad = 12;
    const gap = 10;
    let left = rect.left;
    if (left + width > window.innerWidth - pad) {
      left = window.innerWidth - pad - width;
    }
    if (left < pad) left = pad;
    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - pad) {
      top = rect.top - gap - height;
    }
    if (top < pad) top = pad;
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const frame = requestAnimationFrame(place);
    function onScroll() {
      setOpen(false);
    }
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place, voters.length]);

  function group(label: string, rows: GameVoter[], dimmed: boolean) {
    if (rows.length === 0) return null;
    return (
      <div className={styles.group}>
        <p className={styles.groupLabel}>{label}</p>
        <ul className={styles.people}>
          {rows.map((row) => (
            <li key={row.member.id} className={styles.person}>
              <MemberAvatar member={row.member} size="sm" dimmed={dimmed} />
              <span className={styles.personName}>{row.member.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <span
      ref={anchorRef}
      className={styles.anchor}
      aria-label={`${likes} of ${members} liked`}
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      {stack.length > 0 ? (
        <span className={styles.stack} aria-hidden>
          {stack.map((row) => (
            <MemberAvatar
              key={row.member.id}
              member={row.member}
              size="xs"
              dimmed={row.vote !== "like"}
            />
          ))}
          {overflow > 0 ? (
            <span className={styles.more}>+{overflow}</span>
          ) : null}
        </span>
      ) : null}
      <span className={styles.count}>
        {likes}/{members} liked
      </span>
      {open && hasTip
        ? createPortal(
            <div
              ref={cardRef}
              className={styles.tip}
              role="tooltip"
              style={{ top: pos.top, left: pos.left }}
              onMouseEnter={clearTimers}
              onMouseLeave={scheduleHide}
            >
              {group("Liked", liked, false)}
              {group("Skipped", skipped, true)}
              {group("Waiting", waiting, true)}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
