"use client";

import { useId, useState, type ReactNode } from "react";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import styles from "./FilterAccordion.module.css";

type Props = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function FilterAccordion({
  title,
  summary,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className={styles.root} data-open={open}>
      <h3 className={styles.heading}>
        <button
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.title}>{title}</span>
          {summary ? <span className={styles.summary}>{summary}</span> : null}
          <ChevronLeftIcon className={styles.chevron} aria-hidden />
        </button>
      </h3>
      <div id={bodyId} className={styles.body} inert={!open}>
        <div className={styles.inner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </section>
  );
}
