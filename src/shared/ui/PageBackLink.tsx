import Link from "next/link";
import styles from "./PageBackLink.module.css";

type Props = {
  href: string;
  children: string;
  className?: string;
};

export function PageBackLink({ href, children, className }: Props) {
  return (
    <Link
      href={href}
      className={className ? `${styles.link} ${className}` : styles.link}
    >
      {children}
    </Link>
  );
}
