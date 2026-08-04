import { ActionButton } from "@/components/ActionButton";
import { AppTopBar } from "@/components/AppTopBar";

export default function DeckLoadingPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar remainingLabel="— left" />

      <div className="flex min-h-0 flex-1 items-center justify-center gap-16">
        <ActionButton type="dislike" muted />

        <div className="relative h-[626px] w-[460px] overflow-hidden rounded-2xl border border-white/[0.06] bg-sw-surface">
          <div className="sw-shimmer absolute inset-0" />
          <div className="absolute right-0 bottom-0 left-0 flex flex-col gap-3 px-6 pb-7">
            <SkeletonLine width="45%" height={10} />
            <SkeletonLine width="75%" height={22} />
            <div className="flex gap-2">
              <SkeletonLine width={64} height={22} radius={6} />
              <SkeletonLine width={52} height={22} radius={6} />
            </div>
            <SkeletonLine width="95%" height={12} />
            <SkeletonLine width="80%" height={12} />
          </div>
        </div>

        <ActionButton type="like" muted />
      </div>
    </div>
  );
}

function SkeletonLine({
  width,
  height,
  radius = 4,
}: {
  width: string | number;
  height: number;
  radius?: number;
}) {
  return (
    <div
      className="bg-white/[0.07]"
      style={{
        width,
        height,
        borderRadius: radius,
      }}
    />
  );
}
