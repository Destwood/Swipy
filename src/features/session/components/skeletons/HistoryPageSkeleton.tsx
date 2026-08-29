"use client";

import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import { HistoryRowSkeleton } from "./HistoryRowSkeleton";
import pageStyles from "@/features/session/components/SwipeHistoryClient.module.css";

type Props = {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  rows?: number;
};

export function HistoryPageSkeleton({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  rows = 5,
}: Props) {
  return (
    <div className={pageStyles.root}>
      <AppTopBar />
      <div className={pageStyles.scroll}>
        <div className={pageStyles.page}>
          <PageBackLink href={backHref}>{backLabel}</PageBackLink>
          <div className={pageStyles.header}>
            <p className={pageStyles.eyebrow}>{eyebrow}</p>
            <h1 className={pageStyles.title}>{title}</h1>
            <p className={pageStyles.subtitle}>{subtitle}</p>
          </div>
          <ul
            className={pageStyles.list}
            aria-busy="true"
            aria-label="Loading history"
          >
            {Array.from({ length: rows }, (_, i) => (
              <HistoryRowSkeleton key={`sk-${i}`} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
