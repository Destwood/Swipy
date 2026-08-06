import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";
import styles from "./motion.module.css";

type Props<T extends ElementType> = {
  children: ReactNode;
  className?: string;
  amount?: "sm" | "md";
  as?: T;
  press?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function HoverLift<T extends ElementType = "div">({
  children,
  className,
  amount = "md",
  as,
  press = false,
  ...rest
}: Props<T>) {
  const Tag = as ?? "div";
  const liftClass = amount === "sm" ? styles.liftSm : styles.liftMd;
  return (
    <Tag
      className={`${styles.lift} ${liftClass}${press ? ` ${styles.press}` : ""}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
