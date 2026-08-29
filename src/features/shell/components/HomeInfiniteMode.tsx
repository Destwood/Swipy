"use client";

import { useState } from "react";
import { InfiniteModeDialog } from "@/features/session/components/InfiniteModeDialog";
import { Button, ButtonVariant } from "@/shared/ui/Button";

export function HomeInfiniteMode() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={ButtonVariant.Dark}
        onClick={() => setOpen(true)}
      >
        Infinite mode
      </Button>
      <InfiniteModeDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
