"use client";

import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import pageStyles from "@/features/session/components/SessionMatchesClient.module.css";
import sk from "./MatchResultsPageSkeleton.module.css";

type Props = {
  backHref?: string;
  backLabel?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  compactRows?: number;
};

function HeroRowSkeleton() {
  return (
    <li aria-hidden>
      <div className={sk.heroCard}>
        <div className={`${sk.heroCover} sw-shimmer`} />
        <div className={sk.heroBody}>
          <div className={`${sk.heroTitle} sw-shimmer`} />
          <div className={sk.heroTags}>
            <div className={`${sk.heroTag} sw-shimmer`} />
            <div className={`${sk.heroTag} sw-shimmer`} />
          </div>
          <div className={`${sk.heroMeta} sw-shimmer`} />
          <div className={sk.heroActions}>
            <div className={`${sk.heroAction} sw-shimmer`} />
            <div className={`${sk.heroAction} sw-shimmer`} />
          </div>
        </div>
      </div>
    </li>
  );
}

function CompactRowSkeleton() {
  return (
    <li className={sk.compactRow} aria-hidden>
      <div className={`${sk.thumb} sw-shimmer`} />
      <div className={sk.compactBody}>
        <div className={`${sk.compactTitle} sw-shimmer`} />
        <div className={sk.compactTags}>
          <div className={`${sk.compactTag} sw-shimmer`} />
          <div className={`${sk.compactTag} sw-shimmer`} />
        </div>
      </div>
      <div className={`${sk.compactPrice} sw-shimmer`} />
      <div className={`${sk.compactFav} sw-shimmer`} />
      <div className={`${sk.compactAction} sw-shimmer`} />
    </li>
  );
}

export function MatchResultsPageSkeleton({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  compactRows = 4,
}: Props) {
  return (
    <div className={pageStyles.root}>
      <AppTopBar />
      <div className={pageStyles.scroll}>
        <div className={pageStyles.page}>
          {backHref && backLabel ? (
            <PageBackLink href={backHref}>{backLabel}</PageBackLink>
          ) : null}
          <div className={pageStyles.headerRow}>
            <div className={pageStyles.headerMain}>
              <p className={pageStyles.eyebrow}>{eyebrow}</p>
              <h1 className={pageStyles.title}>{title}</h1>
              <p className={pageStyles.subtitle}>{subtitle}</p>
            </div>
          </div>

          <section className={pageStyles.section} aria-busy="true">
            <div className={sk.sectionHeader}>
              <div className={`${sk.sectionTitle} sw-shimmer`} />
              <div className={`${sk.sectionMeta} sw-shimmer`} />
            </div>
            <ul className={sk.heroList}>
              <HeroRowSkeleton />
            </ul>
          </section>

          <section className={pageStyles.section} aria-hidden>
            <div className={sk.sectionHeader}>
              <div className={`${sk.sectionTitle} sw-shimmer`} />
              <div className={`${sk.sectionMeta} sw-shimmer`} />
            </div>
            <ul className={sk.list}>
              {Array.from({ length: compactRows }, (_, i) => (
                <CompactRowSkeleton key={`sk-${i}`} />
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
