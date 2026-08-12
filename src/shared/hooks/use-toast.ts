import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

interface ToastState {
  message: string | null;
  variant: ToastVariant;
  // Bumped on every show() call, including repeats of the same message —
  // the Toast component watches this (not just message/variant) to know
  // a *new* toast fired, so showing "Saved" twice in a row still resets
  // the auto-dismiss timer and re-triggers the entrance animation instead
  // of silently no-oping because the text didn't change.
  key: number;

  show: (message: string, variant?: ToastVariant) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: "info",
  key: 0,

  show: (message, variant = "info") =>
    set((state) => ({ message, variant, key: state.key + 1 })),

  hide: () => set({ message: null }),
}));

// Convenience wrappers — the vast majority of call sites just want
// "submission succeeded" or "submission failed," not to think about
// variant naming every time.
export const toast = {
  success: (message: string) => useToastStore.getState().show(message, "success"),
  error: (message: string) => useToastStore.getState().show(message, "error"),
  info: (message: string) => useToastStore.getState().show(message, "info"),
};
