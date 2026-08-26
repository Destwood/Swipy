import Image from "next/image";
import type { SessionMember } from "@/features/session/data/session";
import styles from "./MemberAvatar.module.css";

type Size = "xs" | "sm";

type Props = {
  member: Pick<SessionMember, "name" | "initials" | "color" | "avatarUrl">;
  size?: Size;
  dimmed?: boolean;
  className?: string;
};

export function MemberAvatar({
  member,
  size = "sm",
  dimmed = false,
  className,
}: Props) {
  const photo = member.avatarUrl?.trim() || null;

  return (
    <span
      className={`${styles.root} ${styles[size]}${dimmed ? ` ${styles.dimmed}` : ""}${className ? ` ${className}` : ""}`}
      style={photo ? undefined : { background: member.color }}
      title={member.name}
    >
      {photo ? (
        <Image
          src={photo}
          alt=""
          fill
          className={styles.photo}
          sizes={size === "xs" ? "22px" : "28px"}
          unoptimized
        />
      ) : (
        <span className={styles.initials}>{member.initials}</span>
      )}
    </span>
  );
}
