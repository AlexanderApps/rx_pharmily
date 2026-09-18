import { create } from "zustand";

// WebTopBar (shared/components/web-top-bar.tsx) is rendered once, in
// the app-wide layout shell (web-app-shell.tsx) — it has no way to
// call a specific page's own refresh logic directly, since that logic
// lives inside that page's own component tree, not the shell's. A page
// that wants a refresh button to appear in the top bar registers its
// own handler here on mount and clears it on unmount; WebTopBar reads
// whatever's currently registered and only shows the button when
// something is. Calling the registered function directly (not
// reimplementing the same fetch calls inside WebTopBar itself) matters
// specifically for the home feed: its own handleRefresh also resets
// local pagination state that only that component can reach — a
// version of "refresh" that only re-ran the underlying store fetches
// would silently skip that part.
interface TopBarRefreshState {
  onRefresh: (() => Promise<void>) | null;
  isRefreshing: boolean;
  setOnRefresh: (fn: (() => Promise<void>) | null) => void;
  setIsRefreshing: (value: boolean) => void;
}

export const useTopBarRefreshStore = create<TopBarRefreshState>((set) => ({
  onRefresh: null,
  isRefreshing: false,
  setOnRefresh: (fn) => set({ onRefresh: fn }),
  setIsRefreshing: (value) => set({ isRefreshing: value }),
}));
