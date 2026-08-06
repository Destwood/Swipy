import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
} from "react";
import styles from "./motion.module.css";

type Props<T extends ElementType> = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: T;
  style?: CSSProperties;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className" | "style">;

export function FadeIn<T extends ElementType = "div">({
  children,
  className,
  delayMs = 0,
  as,
  style,
  ...rest
}: Props<T>) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={`${styles.fadeUp}${className ? ` ${className}` : ""}`}
      style={{
        ...style,
        animationDelay: delayMs ? `${delayMs}ms` : undefined,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
