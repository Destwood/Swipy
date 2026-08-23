"use client";

import Link from "next/link";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import styles from "./Button.module.css";
import { ButtonSize, ButtonVariant } from "./button-variant";

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = Common &
  Omit<ComponentPropsWithoutRef<"button">, "className"> & {
    href?: undefined;
  };

type ButtonAsLink = Common &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  [ButtonVariant.Accent]: styles.accent,
  [ButtonVariant.Dark]: styles.ghost,
  [ButtonVariant.Soft]: styles.soft,
  [ButtonVariant.Danger]: styles.danger,
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  [ButtonSize.Md]: styles.md,
  [ButtonSize.Sm]: styles.sm,
};

function surfaceClass(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return [styles.root, VARIANT_CLASS[variant], SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(" ");
}

const ButtonInner = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(
  {
    variant = ButtonVariant.Accent,
    size = ButtonSize.Md,
    className,
    children,
    href,
    ...rest
  },
  ref,
) {
  const classNames = surfaceClass(variant, size, className);

  if (href) {
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={classNames}
        {...(rest as Omit<ButtonAsLink, keyof Common | "href">)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      className={classNames}
      {...(rest as Omit<ButtonAsButton, keyof Common | "href">)}
    >
      {children}
    </button>
  );
});

export const Button = ButtonInner as {
  (props: ButtonAsButton & { ref?: Ref<HTMLButtonElement> }): ReactElement;
  (props: ButtonAsLink & { ref?: Ref<HTMLAnchorElement> }): ReactElement;
};
