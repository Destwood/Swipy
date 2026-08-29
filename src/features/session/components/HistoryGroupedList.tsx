"use client";

import { HistoryRow } from "@/features/session/components/HistoryRow";
import { groupHistoryByDay, type HistoryListItem } from "@/features/session/lib/history-items";
import listStyles from "@/features/session/components/SwipeHistoryClient.module.css";

type Props = {
  items: HistoryListItem[];
  busyId: string | null;
  onShare: (item: HistoryListItem) => void;
  onTransform: (item: HistoryListItem) => void;
  onDelete?: (item: HistoryListItem) => void;
  onCoopOpen?: (item: HistoryListItem, e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function HistoryGroupedList({
  items,
  busyId,
  onShare,
  onTransform,
  onDelete,
  onCoopOpen,
}: Props) {
  const groups = groupHistoryByDay(items);

  return (
    <div className={listStyles.dayGroups}>
      {groups.map((group) => (
        <section key={group.dayKey} className={listStyles.daySection}>
          <h2 className={listStyles.dayHeading}>{group.label}</h2>
          <ul className={listStyles.list}>
            {group.items.map((item) => (
              <HistoryRow
                key={item.id}
                title={item.title}
                covers={item.covers}
                tags={[...item.tags]}
                completedAt={item.completedAt}
                stats={item.stats}
                openHref={item.href}
                onOpen={
                  item.kind === "coop" && onCoopOpen
                    ? (e) => onCoopOpen(item, e)
                    : undefined
                }
                onShare={() => onShare(item)}
                onTransform={() => onTransform(item)}
                onDelete={
                  item.kind === "solo" && onDelete
                    ? () => onDelete(item)
                    : undefined
                }
                canTransform={item.likeCount > 0}
                deckId={item.deckId}
                busy={busyId === item.id}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
