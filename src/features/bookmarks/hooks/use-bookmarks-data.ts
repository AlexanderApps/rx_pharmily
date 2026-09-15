import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { Bookmark, BookmarkContentType, BookmarkDisplayInfo } from "@/features/bookmarks/types/bookmarks.types";

function mapBookmarkRow(row: any): Bookmark {
  return {
    id: row.id,
    contentType: row.content_type,
    contentId: row.content_id,
    code: row.code ?? undefined,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    status: row.status ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function key(contentType: BookmarkContentType, contentId: string) {
  return `${contentType}:${contentId}`;
}

interface BookmarksState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  hasFetched: boolean;

  fetchBookmarks: () => Promise<void>;
  isBookmarked: (contentType: BookmarkContentType, contentId: string) => boolean;
  toggleBookmark: (
    contentType: BookmarkContentType,
    contentId: string,
    info: BookmarkDisplayInfo,
  ) => Promise<boolean>;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  isLoading: false,
  hasFetched: false,

  fetchBookmarks: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[bookmarks] fetchBookmarks failed:", error.message);
      set({ isLoading: false, hasFetched: true });
      return;
    }
    set({ bookmarks: (data ?? []).map(mapBookmarkRow), isLoading: false, hasFetched: true });
  },

  // Local lookup only — bookmarks are fetched once up front (small,
  // personal list) rather than checked one-by-one per item on every
  // list/detail screen, so this never itself makes a network call.
  isBookmarked: (contentType, contentId) => {
    const target = key(contentType, contentId);
    return get().bookmarks.some((b) => key(b.contentType, b.contentId) === target);
  },

  toggleBookmark: async (contentType, contentId, info) => {
    const userId = await requireUserId();
    const existing = get().bookmarks.find(
      (b) => b.contentType === contentType && b.contentId === contentId,
    );

    if (existing) {
      const previous = get().bookmarks;
      set({ bookmarks: previous.filter((b) => b.id !== existing.id) });
      const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
      if (error) {
        console.warn("[bookmarks] remove failed:", error.message);
        set({ bookmarks: previous });
        return false;
      }
      return true;
    }

    // Optimistic add with a temporary id — swapped for the real row
    // once the insert returns, same rollback-on-failure shape used
    // elsewhere in this app for optimistic writes.
    const previous = get().bookmarks;
    const optimistic: Bookmark = {
      id: `optimistic-${contentType}-${contentId}`,
      contentType,
      contentId,
      code: info.code,
      title: info.title,
      subtitle: info.subtitle,
      status: info.status,
      createdAt: new Date(),
    };
    set({ bookmarks: [optimistic, ...previous] });

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        code: info.code ?? null,
        title: info.title,
        subtitle: info.subtitle ?? null,
        status: info.status ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.warn("[bookmarks] add failed:", error?.message);
      set({ bookmarks: previous });
      return false;
    }

    set((state) => ({
      bookmarks: state.bookmarks.map((b) => (b.id === optimistic.id ? mapBookmarkRow(data) : b)),
    }));
    return true;
  },
}));
