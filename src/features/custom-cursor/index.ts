/**
 * Optional UI module. To remove completely:
 * 1. Delete this folder (`src/features/custom-cursor`)
 * 2. Remove imports/usages:
 *    - `src/app/layout.tsx` → `<CustomCursor />`
 *    - `src/features/account/components/AccountPreferencesPage.tsx` → `<CustomCursorToggle />`
 *    - `src/features/auth/components/AuthMenu.tsx` → `<CustomCursorToggle />`
 */
export { CustomCursor } from "./CustomCursor";
export { CustomCursorToggle } from "./CustomCursorToggle";
