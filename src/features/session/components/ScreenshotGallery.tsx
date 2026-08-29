"use client";

import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import ArrowRightIcon from "@/assets/icons/arrow-right.svg";
import CloseIcon from "@/assets/icons/close.svg";
import styles from "./ScreenshotGallery.module.css";

type Props = {
  title: string;
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
};

export function ScreenshotGallery({
  title,
  images,
  index,
  onClose,
  onIndex,
}: Props) {
  const total = images.length;
  const src = images[index];

  useEffect(() => {
    document.body.dataset.galleryOpen = "1";
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (
        e.key !== "Escape" &&
        e.key !== "ArrowRight" &&
        e.key !== "ArrowLeft"
      ) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % total);
      if (e.key === "ArrowLeft") onIndex((index - 1 + total) % total);
    }

    window.addEventListener("keydown", onKey, true);
    return () => {
      delete document.body.dataset.galleryOpen;
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [index, total, onClose, onIndex]);

  if (!src) return null;

  return createPortal(
    <div
      className={styles.root}
      data-screenshot-gallery=""
      role="dialog"
      aria-modal="true"
      aria-label={`${title} screenshots`}
      onClick={onClose}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="Close gallery"
        onClick={onClose}
      >
        <span className={styles.closeFace}>
          <CloseIcon className={styles.closeIcon} />
        </span>
      </button>

      {total > 1 ? (
        <button
          type="button"
          className={`${styles.nav} ${styles.prev}`}
          aria-label="Previous screenshot"
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index - 1 + total) % total);
          }}
        >
          <span className={styles.navFace}>
            <ChevronLeftIcon className={styles.navIcon} />
          </span>
        </button>
      ) : null}

      <div
        className={styles.frame}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={`${title} screenshot ${index + 1}`}
          width={1920}
          height={1080}
          className={styles.image}
          unoptimized
        />
        <p className={styles.counter}>
          {index + 1} / {total}
        </p>
      </div>

      {total > 1 ? (
        <button
          type="button"
          className={`${styles.nav} ${styles.next}`}
          aria-label="Next screenshot"
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index + 1) % total);
          }}
        >
          <span className={styles.navFace}>
            <ArrowRightIcon className={styles.navIcon} />
          </span>
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
