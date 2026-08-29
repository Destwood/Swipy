"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import CopyIcon from "@/assets/icons/copy.svg";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./ResultsPageToolbar.module.css";

export type ResultsMenuItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
};

type Props = {
  onCopyLink: () => void;
  copyDisabled?: boolean;
  menuItems: ResultsMenuItem[];
};

export function ResultsPageToolbar({
  onCopyLink,
  copyDisabled = false,
  menuItems,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const visibleItems = menuItems.filter((item) => item.label);

  return (
    <div className={styles.toolbar}>
      <Button
        type="button"
        variant={ButtonVariant.Soft}
        size={ButtonSize.Sm}
        disabled={copyDisabled}
        onClick={() => void onCopyLink()}
      >
        <span className={styles.copyLabel}>
          <CopyIcon className={styles.copyIcon} aria-hidden />
          Copy link
        </span>
      </Button>

      {visibleItems.length > 0 ? (
        <div className={styles.menuWrap} ref={menuRef}>
          <Button
            type="button"
            variant={ButtonVariant.Dark}
            size={ButtonSize.Sm}
            aria-label="More"
            aria-expanded={menuOpen}
            className={styles.menuTrigger}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ···
          </Button>
          {menuOpen ? (
            <div className={styles.menu}>
              {visibleItems.map((item, index) => (
                <Fragment key={item.label}>
                  {index > 0 ? (
                    <div className={styles.menuDivider} role="separator" />
                  ) : null}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={styles.menuItem}
                      onClick={() => {
                        setMenuOpen(false);
                        item.onClick?.();
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={styles.menuItem}
                      disabled={item.disabled}
                      onClick={() => {
                        setMenuOpen(false);
                        item.onClick?.();
                      }}
                    >
                      {item.label}
                    </button>
                  )}
                </Fragment>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
