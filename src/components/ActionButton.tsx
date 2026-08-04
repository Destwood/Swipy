interface Props {
  type: "like" | "dislike";
  muted?: boolean;
  onClick?: () => void;
}

export function ActionButton({ type, muted = false, onClick }: Props) {
  const isLike = type === "like";

  if (muted) {
    return (
      <div
        className="h-[88px] w-[88px] shrink-0 rounded-full border-[1.5px] border-white/[0.06] bg-white/[0.03]"
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={isLike ? "Like" : "Dislike"}
      onClick={onClick}
      className={`flex h-[88px] w-[88px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-all duration-[180ms] ease-out ${
        isLike
          ? "border-[rgba(52,211,153,0.28)] bg-[rgba(52,211,153,0.1)] hover:border-[rgba(52,211,153,0.5)] hover:bg-[rgba(52,211,153,0.2)] hover:shadow-[0_0_28px_rgba(52,211,153,0.18)]"
          : "border-[rgba(251,113,133,0.28)] bg-[rgba(251,113,133,0.1)] hover:border-[rgba(251,113,133,0.5)] hover:bg-[rgba(251,113,133,0.2)] hover:shadow-[0_0_28px_rgba(251,113,133,0.18)]"
      }`}
    >
      {isLike ? (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
          <path
            d="M14 24s-11-6.5-11-13.5a5.5 5.5 0 0111 0 5.5 5.5 0 0111 0C25 17.5 14 24 14 24z"
            fill="#34d399"
            stroke="#34d399"
            strokeWidth="0.5"
          />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 4l16 16M20 4L4 20"
            stroke="#fb7185"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
