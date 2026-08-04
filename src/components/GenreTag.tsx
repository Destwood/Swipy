interface Props {
  label: string;
  accent?: boolean;
}

export function GenreTag({ label, accent = false }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium tracking-[0.01em] font-body ${
        accent
          ? "border border-[rgba(45,212,191,0.28)] bg-sw-accent-d text-sw-accent"
          : "border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.08)] text-[#aab4c2]"
      }`}
    >
      {label}
    </span>
  );
}
