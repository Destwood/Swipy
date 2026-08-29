"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import ArrowRightIcon from "@/assets/icons/arrow-right.svg";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import rowStyles from "./HistoryRow.module.css";

const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop&auto=format";

export function padCovers(covers: string[]): string[] {
  const next = covers.slice(0, 4);
  while (next.length < 4) next.push(PLACEHOLDER_COVER);
  return next;
}

export function formatHistoryTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  title: string;
  covers: string[];
  tags: string[];
  completedAt: string;
  stats?: string;
  openHref: string;
  onOpen?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onShare?: () => void;
  onTransform?: () => void;
  onDelete?: () => void;
  canTransform?: boolean;
  deckId?: string;
  busy?: boolean;
};

export function HistoryRow({
  title,
  covers,
  tags,
  completedAt,
  stats,
  openHref,
  onOpen,
  onShare,
  onTransform,
  onDelete,
  canTransform = false,
  deckId,
  busy = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mosaic = padCovers(covers);
  const showTransform = Boolean(onTransform);
  const metaLine = [formatHistoryTime(completedAt), stats].filter(Boolean).join(" · ");

  const menuEntries = [
    onShare
      ? {
          key: "share",
          node: (
            <button
              type="button"
              className={rowStyles.menuItem}
              onClick={() => {
                setMenuOpen(false);
                onShare();
              }}
            >
              Copy link
            </button>
          ),
        }
      : null,
    showTransform
      ? {
          key: "transform",
          node: (
            <button
              type="button"
              className={rowStyles.menuItem}
              disabled={busy || !canTransform}
              onClick={() => {
                setMenuOpen(false);
                onTransform?.();
              }}
            >
              {busy ? "Creating…" : "Transform to deck"}
            </button>
          ),
        }
      : null,
    deckId
      ? {
          key: "open-deck",
          node: (
            <Link
              href={`/decks/${encodeURIComponent(deckId)}`}
              className={rowStyles.menuItem}
              onClick={() => setMenuOpen(false)}
            >
              Open deck
            </Link>
          ),
        }
      : null,
    onDelete
      ? {
          key: "delete",
          node: (
            <button
              type="button"
              className={`${rowStyles.menuItem} ${rowStyles.menuItemDanger}`}
              disabled={busy}
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              Delete
            </button>
          ),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; node: ReactNode }>;

  function handleOpen(e: React.MouseEvent<HTMLAnchorElement>) {
    if (onOpen) onOpen(e);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <li className={`${rowStyles.row} ${menuOpen ? rowStyles.rowMenuOpen : ""}`}>
      <div className={rowStyles.rowMain}>
        <Link
          href={openHref}
          className={rowStyles.mosaicLink}
          aria-label={`Open ${title}`}
          onClick={handleOpen}
        >
          <div className={rowStyles.mosaic}>
            {mosaic.map((src, i) => (
              <div key={`${title}-${i}`} className={rowStyles.mosaicCell}>
                <Image
                  src={src}
                  alt=""
                  fill
                  className={rowStyles.mosaicImage}
                  sizes="64px"
                  unoptimized={src.includes("igdb") || src.includes("rawg")}
                />
              </div>
            ))}
          </div>
          <span className={rowStyles.mosaicOverlay} aria-hidden>
            <ArrowRightIcon className={rowStyles.openIcon} />
          </span>
        </Link>

        <div className={rowStyles.body}>
          <Link
            href={openHref}
            className={rowStyles.titleLink}
            onClick={handleOpen}
          >
            <h3 className={rowStyles.title}>{title}</h3>
          </Link>
          <div className={rowStyles.tags}>
            {tags.map((tag, i) => (
              <span
                key={tag}
                className={`${rowStyles.tag} ${i === 0 ? rowStyles.tagAccent : ""}`}
              >
                {tag}
              </span>
            ))}
          </div>
          {metaLine ? <p className={rowStyles.meta}>{metaLine}</p> : null}
        </div>
      </div>

      <div className={rowStyles.toolbar}>
        <Button
          href={openHref}
          size={ButtonSize.Sm}
          variant={ButtonVariant.Soft}
          onClick={onOpen}
        >
          Open
        </Button>

        <div className={rowStyles.menuWrap} ref={menuRef}>
          <Button
            type="button"
            variant={ButtonVariant.Dark}
            size={ButtonSize.Sm}
            aria-label="More"
            aria-expanded={menuOpen}
            className={rowStyles.menuTrigger}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ···
          </Button>
          {menuOpen ? (
            <div className={rowStyles.menu}>
              {menuEntries.map((entry, index) => (
                <Fragment key={entry.key}>
                  {index > 0 ? (
                    <div className={rowStyles.menuDivider} role="separator" />
                  ) : null}
                  {entry.node}
                </Fragment>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
