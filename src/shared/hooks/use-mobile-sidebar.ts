import { create } from "zustand";

interface MobileSidebarState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

// Web-only, compact-breakpoint-only concern — see web-sidebar.tsx and
// web-top-bar.tsx. Not read anywhere on native, and a no-op at
// regular/wide breakpoints where the sidebar is always visible inline.
export const useMobileSidebarStore = create<MobileSidebarState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
