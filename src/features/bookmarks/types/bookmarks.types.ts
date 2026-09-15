export type BookmarkContentType = "rxrfq" | "mediscope" | "donation" | "job";

export interface Bookmark {
  id: string;
  contentType: BookmarkContentType;
  contentId: string;
  code?: string;
  title: string;
  subtitle?: string;
  status?: string;
  createdAt: Date;
}

// What the caller supplies when toggling a bookmark on — display
// fields only, id/contentType are passed separately since they're
// also needed for the off-toggle (delete) path where none of this
// is relevant.
export interface BookmarkDisplayInfo {
  code?: string;
  title: string;
  subtitle?: string;
  status?: string;
}
