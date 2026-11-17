// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/features/decks/lib/deck-store", () => ({ setActiveDeckId: vi.fn() }));

import { UseInSessionDialog } from "@/features/session/components/UseInSessionDialog";

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("Find a game dialog", () => {
  it("A1: shows title, hint, Solo and Together, no Cancel", () => {
    render(<UseInSessionDialog open source="home" onClose={() => {}} />);

    expect(screen.getByRole("dialog", { name: "Find a game" })).toBeTruthy();
    expect(screen.getByText("Choose a mode.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Solo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Together" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("A5: Solo goes to pick-deck with solo intent and closes", async () => {
    const onClose = vi.fn();
    render(<UseInSessionDialog open source="home" onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Solo" }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/session/pick-deck?intent=solo");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
