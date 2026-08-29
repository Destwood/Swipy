"use client";

import { useState } from "react";
import ArrowRightIcon from "@/assets/icons/arrow-right.svg";
import { UseInSessionDialog } from "@/features/session/components/UseInSessionDialog";
import { Button, ButtonVariant } from "@/shared/ui/Button";
import styles from "@/app/page.module.css";

export function HomeFindGame() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={ButtonVariant.Accent}
        onClick={() => setOpen(true)}
      >
        Find a game
        <ArrowRightIcon
          width={16}
          height={16}
          className={styles.primaryIcon}
          aria-hidden
        />
      </Button>
      <UseInSessionDialog
        open={open}
        source="home"
        onClose={() => setOpen(false)}
      />
    </>
  );
}
