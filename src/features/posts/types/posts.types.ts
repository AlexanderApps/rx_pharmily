// Posts covers text posts, polls, news posts, and media attachments (images
// and short videos), with likes and comments. "Stories" is intentionally
// not a separate ephemeral rail — it's folded into regular posts as media
// attachments, since that's the actual functionality being asked for here.

export type PostType = "text" | "poll" | "news";

export type MediaType = "image" | "video";

// Shared cap for any single attached file, enforced at pick-time in the
// composer (see media-picker.tsx).
export const MAX_MEDIA_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export interface PostMedia {
  id: string;
  type: MediaType;
  uri: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number; // video only
}

export interface PostAuthor {
  id: string;
  name: string;
  role?: string;
  avatarColor: string;
}

export interface PollOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  // The option id the current user voted for, or null if they haven't
  // voted yet. Results are hidden from a viewer until they've voted.
  votedOptionId: string | null;
  closesAt?: Date;
}

export interface NewsArticle {
  title: string;
  summary: string;
  imageUrl?: string;
  sourceUrl: string;
}

export interface Post {
  id: string;
  type: PostType;
  author: PostAuthor;
  // Caption/body text. Required for text posts, optional for poll/news posts.
  text: string;
  // Photos/short video attached to a text post. Multiple images render as a
  // swipeable carousel; a video attachment is always alone (see the
  // one-video-OR-many-images rule enforced by the composer).
  media?: PostMedia[];
  poll?: Poll;
  news?: NewsArticle;
  createdAt: Date;
  likeCount: number;
  hasLiked: boolean;
  commentCount: number;
  status: "active" | "suspended";
  deletedAt?: Date;
}

export interface Comment {
  id: string;
  postId: string;
  author: PostAuthor;
  text: string;
  createdAt: Date;
  status: "active" | "suspended";
  deletedAt?: Date;
}

export interface PostFormData {
  type: PostType;
  text: string;
  media?: PostMedia[];
  poll?: {
    question: string;
    options: string[];
    closesAt?: Date;
  };
  news?: NewsArticle;
}
