import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { Comment, Poll, Post, PostAuthor, PostFormData } from "@/features/posts/types/posts.types";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

function mapAuthorFromProfile(profile: any): PostAuthor {
  return {
    id: profile?.id ?? "",
    name: profile?.full_name ?? "Unknown",
    role: undefined,
    avatarColor: profile?.avatar_color ?? "#64748b",
  };
}

function mapMediaRow(row: any) {
  return {
    id: row.id,
    type: row.type,
    uri: row.uri,
    sizeBytes: Number(row.size_bytes),
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    durationMs: row.duration_ms ?? undefined,
  };
}

function mapPoll(pollRow: any, myVotedOptionId: string | null): Poll | undefined {
  if (!pollRow) return undefined;
  return {
    question: pollRow.question,
    options: (pollRow.poll_options ?? []).map((o: any) => ({ id: o.id, label: o.label, voteCount: o.vote_count })),
    votedOptionId: myVotedOptionId,
    closesAt: pollRow.closes_at ? new Date(pollRow.closes_at) : undefined,
  };
}

// hasLiked/poll.votedOptionId are resolved from separately-fetched maps of
// the CURRENT user's own likes/votes (see fetchMyLikes/fetchMyVotes)
// rather than stored on the post itself — the real per-user post_likes/
// poll_votes tables replace the mock's single-viewer-scoped fields.
function mapPostRow(row: any, hasLiked: boolean, myVotedOptionId: string | null): Post {
  return {
    id: row.id,
    type: row.type,
    author: mapAuthorFromProfile(row.profiles),
    text: row.text,
    media: (row.post_media ?? []).length > 0 ? (row.post_media ?? []).map(mapMediaRow) : undefined,
    poll: mapPoll(Array.isArray(row.polls) ? row.polls[0] : row.polls, myVotedOptionId),
    news: row.news_articles
      ? {
          title: (Array.isArray(row.news_articles) ? row.news_articles[0] : row.news_articles).title,
          summary: (Array.isArray(row.news_articles) ? row.news_articles[0] : row.news_articles).summary,
          imageUrl: (Array.isArray(row.news_articles) ? row.news_articles[0] : row.news_articles).image_url ?? undefined,
          sourceUrl: (Array.isArray(row.news_articles) ? row.news_articles[0] : row.news_articles).source_url,
        }
      : undefined,
    createdAt: new Date(row.created_at),
    likeCount: row.like_count,
    hasLiked,
    commentCount: row.comment_count,
  };
}

function mapCommentRow(row: any): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    author: mapAuthorFromProfile(row.profiles),
    text: row.text,
    createdAt: new Date(row.created_at),
  };
}

const POST_SELECT =
  "*, profiles:author_id(id, full_name, avatar_color), post_media(*), polls(*, poll_options(*)), news_articles(*)";

type PostsStore = {
  posts: Post[];
  commentsByPost: Record<string, Comment[]>;
  myLikedPostIds: Set<string>;
  myVotesByPoll: Record<string, string>; // poll_id -> option_id
  isLoading: boolean;

  fetchPosts: () => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  fetchMyLikes: () => Promise<void>;
  fetchMyVotes: () => Promise<void>;

  getPost: (id: string) => Post | undefined;
  getComments: (postId: string) => Comment[];

  addPost: (data: PostFormData) => Promise<string | undefined>;
  deletePost: (id: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  votePoll: (postId: string, optionId: string) => Promise<void>;
};

// A post's poll needs its own id (not just the post's) to record a vote —
// this resolves it from the loaded posts state without threading a
// separate lookup through every call site.
function findPollId(state: { posts: Post[] }, postId: string): string | undefined {
  // Poll id isn't on the mapped Post type (only the poll's own fields are)
  // — pollIdByPost tracks the mapping separately, populated at fetch time.
  return (state as any).pollIdByPost?.[postId];
}

export const usePostsStore = create<PostsStore & { pollIdByPost: Record<string, string> }>((set, get) => ({
  posts: [],
  commentsByPost: {},
  myLikedPostIds: new Set(),
  myVotesByPoll: {},
  pollIdByPost: {},
  isLoading: false,

  fetchPosts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[posts] fetchPosts failed:", error.message);
      set({ isLoading: false });
      return;
    }
    const { myLikedPostIds, myVotesByPoll } = get();
    const pollIdByPost: Record<string, string> = {};
    const posts = (data ?? []).map((row: any) => {
      const pollRow = Array.isArray(row.polls) ? row.polls[0] : row.polls;
      if (pollRow) pollIdByPost[row.id] = pollRow.id;
      return mapPostRow(row, myLikedPostIds.has(row.id), pollRow ? myVotesByPoll[pollRow.id] ?? null : null);
    });
    set({ posts, pollIdByPost: { ...get().pollIdByPost, ...pollIdByPost }, isLoading: false });
  },

  fetchPost: async (id) => {
    const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", id).single();
    if (error || !data) {
      console.warn("[posts] fetchPost failed:", error?.message);
      return;
    }
    const pollRow = Array.isArray((data as any).polls) ? (data as any).polls[0] : (data as any).polls;
    const post = mapPostRow(
      data,
      get().myLikedPostIds.has(id),
      pollRow ? get().myVotesByPoll[pollRow.id] ?? null : null,
    );
    set((state) => ({
      posts: [post, ...state.posts.filter((p) => p.id !== id)],
      pollIdByPost: pollRow ? { ...state.pollIdByPost, [id]: pollRow.id } : state.pollIdByPost,
    }));
  },

  fetchComments: async (postId) => {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles:author_id(id, full_name, avatar_color)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[posts] fetchComments failed:", error.message);
      return;
    }
    set((state) => ({
      commentsByPost: { ...state.commentsByPost, [postId]: (data ?? []).map(mapCommentRow) },
    }));
  },

  fetchMyLikes: async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("post_likes").select("post_id").eq("user_id", userId);
    if (error) {
      console.warn("[posts] fetchMyLikes failed:", error.message);
      return;
    }
    const myLikedPostIds = new Set((data ?? []).map((r) => r.post_id));
    set((state) => ({
      myLikedPostIds,
      posts: state.posts.map((p) => ({ ...p, hasLiked: myLikedPostIds.has(p.id) })),
    }));
  },

  fetchMyVotes: async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("poll_votes").select("poll_id, option_id").eq("user_id", userId);
    if (error) {
      console.warn("[posts] fetchMyVotes failed:", error.message);
      return;
    }
    const myVotesByPoll: Record<string, string> = {};
    for (const row of data ?? []) myVotesByPoll[row.poll_id] = row.option_id;
    set((state) => ({
      myVotesByPoll,
      posts: state.posts.map((p) => {
        const pollId = state.pollIdByPost[p.id];
        if (!p.poll || !pollId) return p;
        return { ...p, poll: { ...p.poll, votedOptionId: myVotesByPoll[pollId] ?? null } };
      }),
    }));
  },

  getPost: (id) => get().posts.find((p) => p.id === id),
  getComments: (postId) => get().commentsByPost[postId] ?? [],

  addPost: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("posts")
      .insert({ author_id: userId, type: data.type, text: data.text.trim() })
      .select()
      .single();
    if (error || !row) {
      console.warn("[posts] addPost failed:", error?.message);
      return undefined;
    }

    if (data.media && data.media.length > 0) {
      await supabase.from("post_media").insert(
        data.media.map((m) => ({
          post_id: row.id,
          type: m.type,
          uri: m.uri,
          size_bytes: m.sizeBytes,
          width: m.width ?? null,
          height: m.height ?? null,
          duration_ms: m.durationMs ?? null,
        })),
      );
    }

    if (data.type === "poll" && data.poll) {
      const { data: pollRow, error: pollError } = await supabase
        .from("polls")
        .insert({ post_id: row.id, question: data.poll.question.trim(), closes_at: data.poll.closesAt?.toISOString() ?? null })
        .select()
        .single();
      if (!pollError && pollRow) {
        const options = data.poll.options.filter((label) => label.trim().length > 0);
        if (options.length > 0) {
          await supabase.from("poll_options").insert(
            options.map((label) => ({ poll_id: pollRow.id, label: label.trim() })),
          );
        }
      }
    }

    if (data.type === "news" && data.news) {
      await supabase.from("news_articles").insert({
        post_id: row.id,
        title: data.news.title,
        summary: data.news.summary,
        image_url: data.news.imageUrl ?? null,
        source_url: data.news.sourceUrl,
      });
    }

    await get().fetchPost(row.id);
    return row.id;
  },

  deletePost: async (id) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      console.warn("[posts] deletePost failed:", error.message);
      return;
    }
    set((state) => {
      const { [id]: _removed, ...rest } = state.commentsByPost;
      return { posts: state.posts.filter((p) => p.id !== id), commentsByPost: rest };
    });
  },

  toggleLike: async (postId) => {
    const userId = await requireUserId();
    const alreadyLiked = get().myLikedPostIds.has(postId);

    if (alreadyLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("post_likes").upsert({ post_id: postId, user_id: userId });
    }

    // Recount from the actual rows rather than a client-side delta — safe
    // against concurrent likes from other users, same reasoning as ads'
    // reaction counts.
    const { count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    await supabase.from("posts").update({ like_count: count ?? 0 }).eq("id", postId);

    set((state) => {
      const myLikedPostIds = new Set(state.myLikedPostIds);
      if (alreadyLiked) myLikedPostIds.delete(postId);
      else myLikedPostIds.add(postId);
      return {
        myLikedPostIds,
        posts: state.posts.map((p) => (p.id === postId ? { ...p, hasLiked: !alreadyLiked, likeCount: count ?? 0 } : p)),
      };
    });
  },

  addComment: async (postId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userId = await requireUserId();

    const { data: row, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: userId, text: trimmed })
      .select("*, profiles:author_id(id, full_name, avatar_color)")
      .single();
    if (error || !row) {
      console.warn("[posts] addComment failed:", error?.message);
      return;
    }

    const comment = mapCommentRow(row);
    await supabase
      .from("posts")
      .update({ comment_count: (get().posts.find((p) => p.id === postId)?.commentCount ?? 0) + 1 })
      .eq("id", postId);

    set((state) => ({
      commentsByPost: { ...state.commentsByPost, [postId]: [...(state.commentsByPost[postId] ?? []), comment] },
      posts: state.posts.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)),
    }));
  },

  votePoll: async (postId, optionId) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post?.poll) return;
    if (post.poll.closesAt && post.poll.closesAt.getTime() < Date.now()) return;

    const pollId = findPollId(get(), postId);
    if (!pollId) return;
    const userId = await requireUserId();
    const previousVote = get().myVotesByPoll[pollId] ?? null;

    if (previousVote === optionId) {
      await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", userId);
    } else {
      await supabase.from("poll_votes").upsert({ poll_id: pollId, user_id: userId, option_id: optionId });
    }

    // Recount each option from the actual vote rows — same race-safety
    // reasoning as likes/reactions elsewhere.
    const { data: optionRows } = await supabase.from("poll_options").select("id").eq("poll_id", pollId);
    const counts: Record<string, number> = {};
    for (const opt of optionRows ?? []) {
      const { count } = await supabase
        .from("poll_votes")
        .select("*", { count: "exact", head: true })
        .eq("poll_id", pollId)
        .eq("option_id", opt.id);
      counts[opt.id] = count ?? 0;
      await supabase.from("poll_options").update({ vote_count: count ?? 0 }).eq("id", opt.id);
    }

    set((state) => {
      const myVotesByPoll = { ...state.myVotesByPoll };
      if (previousVote === optionId) delete myVotesByPoll[pollId];
      else myVotesByPoll[pollId] = optionId;

      return {
        myVotesByPoll,
        posts: state.posts.map((p) => {
          if (p.id !== postId || !p.poll) return p;
          return {
            ...p,
            poll: {
              ...p.poll,
              votedOptionId: previousVote === optionId ? null : optionId,
              options: p.poll.options.map((o) => ({ ...o, voteCount: counts[o.id] ?? o.voteCount })),
            },
          };
        }),
      };
    });
  },
}));
