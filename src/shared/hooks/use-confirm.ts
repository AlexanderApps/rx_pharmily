import { create } from "zustand";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface ConfirmState {
  pending: PendingConfirm | null;
  request: (options: ConfirmOptions) => Promise<boolean>;
  resolve: (confirmed: boolean) => void;
}

// Alert.alert(title, message, [{text: "Cancel"}, {text: "Submit", onPress}])
// — the multi-button form with per-button callbacks — is a well-known gap
// in react-native-web: there's no native browser dialog with custom
// buttons and per-button callbacks, so the polyfill can't reliably
// reproduce it. The practical effect is exactly what it looks like from
// the outside: the button's onPress fires, the handler runs, and then
// nothing visibly happens — no dialog, no confirm callback, no network
// call. confirm() replaces that pattern with a real Modal (see
// confirm-dialog.tsx), which works identically on every platform,
// awaited the same way a native Alert.alert callback would be used.
export const useConfirmStore = create<ConfirmState>((set) => ({
  pending: null,
  request: (options) =>
    new Promise<boolean>((resolve) => {
      set({ pending: { ...options, resolve } });
    }),
  resolve: (confirmed) =>
    set((state) => {
      state.pending?.resolve(confirmed);
      return { pending: null };
    }),
}));

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().request(options);
}
