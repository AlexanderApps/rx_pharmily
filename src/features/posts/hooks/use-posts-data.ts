import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { toast } from "@/shared/hooks/use-toast";
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
    status: row.status,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
  };
}

function mapCommentRow(row: any): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    author: mapAuthorFromProfile(row.profiles),
    text: row.text,
    createdAt: new Date(row.created_at),
    status: row.status,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
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
  // Admin moderation — distinct from deletePost above (an unused,
  // unrelated hard-delete). suspend/reinstate toggle the status flag;
  // remove/restore use the existing soft-delete columns (deleted_at/
  // deleted_by) that posts already had before this.
  suspendPost: (id: string) => Promise<boolean>;
  reinstatePost: (id: string) => Promise<boolean>;
  removePost: (id: string) => Promise<boolean>;
  restorePost: (id: string) => Promise<boolean>;
  suspendComment: (postId: string, commentId: string) => Promise<boolean>;
  reinstateComment: (postId: string, commentId: string) => Promise<boolean>;
  removeComment: (postId: string, commentId: string) => Promise<boolean>;
  restoreComment: (postId: string, commentId: string) => Promise<boolean>;
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

  suspendPost: async (id) => {
    const { error } = await supabase.from("posts").update({ status: "suspended" }).eq("id", id);
    if (error) {
      console.warn("[posts] suspendPost failed:", error.message);
      return false;
    }
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, status: "suspended" } : p)),
    }));
    return true;
  },

  reinstatePost: async (id) => {
    const { error } = await supabase.from("posts").update({ status: "active" }).eq("id", id);
    if (error) {
      console.warn("[posts] reinstatePost failed:", error.message);
      return false;
    }
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, status: "active" } : p)),
    }));
    return true;
  },

  removePost: async (id) => {
    const adminId = await requireUserId();
    const { error } = await supabase
      .from("posts")
      .update({ deleted_at: new Date().toISOString(), deleted_by: adminId })
      .eq("id", id);
    if (error) {
      console.warn("[posts] removePost failed:", error.message);
      return false;
    }
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, deletedAt: new Date() } : p)),
    }));
    return true;
  },

  restorePost: async (id) => {
    const { error } = await supabase.from("posts").update({ deleted_at: null, deleted_by: null }).eq("id", id);
    if (error) {
      console.warn("[posts] restorePost failed:", error.message);
      return false;
    }
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, deletedAt: undefined } : p)),
    }));
    return true;
  },

  suspendComment: async (postId, commentId) => {
    const { error } = await supabase.from("comments").update({ status: "suspended" }).eq("id", commentId);
    if (error) {
      console.warn("[posts] suspendComment failed:", error.message);
      return false;
    }
    set((state) => ({
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: (state.commentsByPost[postId] ?? []).map((c) =>
          c.id === commentId ? { ...c, status: "suspended" } : c,
        ),
      },
    }));
    return true;
  },

  reinstateComment: async (postId, commentId) => {
    const { error } = await supabase.from("comments").update({ status: "active" }).eq("id", commentId);
    if (error) {
      console.warn("[posts] reinstateComment failed:", error.message);
      return false;
    }
    set((state) => ({
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: (state.commentsByPost[postId] ?? []).map((c) =>
          c.id === commentId ? { ...c, status: "active" } : c,
        ),
      },
    }));
    return true;
  },

  removeComment: async (postId, commentId) => {
    const adminId = await requireUserId();
    const { error } = await supabase
      .from("comments")
      .update({ deleted_at: new Date().toISOString(), deleted_by: adminId })
      .eq("id", commentId);
    if (error) {
      console.warn("[posts] removeComment failed:", error.message);
      return false;
    }
    set((state) => ({
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: (state.commentsByPost[postId] ?? []).map((c) =>
          c.id === commentId ? { ...c, deletedAt: new Date() } : c,
        ),
      },
    }));
    return true;
  },

  restoreComment: async (postId, commentId) => {
    const { error } = await supabase
      .from("comments")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", commentId);
    if (error) {
      console.warn("[posts] restoreComment failed:", error.message);
      return false;
    }
    set((state) => ({
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: (state.commentsByPost[postId] ?? []).map((c) =>
          c.id === commentId ? { ...c, deletedAt: undefined } : c,
        ),
      },
    }));
    return true;
  },

  toggleLike: async (postId) => {
    const alreadyLiked = get().myLikedPostIds.has(postId);
    const currentPost = get().posts.find((p) => p.id === postId);
    if (!currentPost) return;

    // Snapshot for rollback if the server call actually fails.
    const previousPosts = get().posts;
    const previousMyLikedPostIds = get().myLikedPostIds;

    // Apply optimistically — immediate, felt feedback instead of
    // waiting on a network round trip. The previous version of this
    // function made 3 separate, sequentially-awaited requests (insert/
    // delete the like, count all likes, update posts.like_count) before
    // the UI updated at all. toggle_post_like (see its own migration)
    // now does the whole thing server-side in one atomic call; this is
    // what the person sees the instant they tap, rolled back if it
    // actually fails.
    set((state) => {
      const myLikedPostIds = new Set(state.myLikedPostIds);
      if (alreadyLiked) myLikedPostIds.delete(postId);
      else myLikedPostIds.add(postId);
      return {
        myLikedPostIds,
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, hasLiked: !alreadyLiked, likeCount: Math.max(0, p.likeCount + (alreadyLiked ? -1 : 1)) }
            : p,
        ),
      };
    });

    const { error } = await supabase.rpc("toggle_post_like", { p_post_id: postId });
    if (error) {
      console.warn("[posts] toggleLike failed:", error.message);
      toast.error("Couldn't update your like. Please try again.");
      set({ posts: previousPosts, myLikedPostIds: previousMyLikedPostIds });
      return;
    }

    // Reconcile with the actual server-side count in the background —
    // the optimistic +1/-1 above is a good approximation, but likes are
    // inherently multi-user, so someone else's concurrent like could
    // make it drift slightly. This corrects that without blocking or
    // re-flashing the like that already visibly landed.
    const { data: postRow } = await supabase.from("posts").select("like_count").eq("id", postId).single();
    if (!postRow) return;

    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, likeCount: postRow.like_count } : p)),
    }));
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

    const previousVote = get().myVotesByPoll[pollId] ?? null;
    const isTogglingOff = previousVote === optionId;

    // Snapshot for rollback if the server call actually fails.
    const previousPosts = get().posts;
    const previousMyVotesByPoll = get().myVotesByPoll;

    // Apply the vote optimistically — immediate, felt feedback the
    // instant someone taps, instead of waiting on a network round trip.
    // The previous version of this function made roughly 2N+2
    // SEPARATE, sequentially-awaited requests for an N-option poll (one
    // to record the vote, one to list options, then a count query PLUS
    // an update query for every single option) before the UI updated at
    // all — for a typical 4-option poll, 10 round trips back to back,
    // easily 1-3+ seconds of visible lag with zero feedback in the
    // meantime. cast_poll_vote (see its own migration) now does the
    // whole thing server-side in one atomic call; this optimistic
    // update is what the person sees the instant they tap, reconciled
    // against the real counts afterward and rolled back if it fails.
    set((state) => {
      const myVotesByPoll = { ...state.myVotesByPoll };
      if (isTogglingOff) delete myVotesByPoll[pollId];
      else myVotesByPoll[pollId] = optionId;

      return {
        myVotesByPoll,
        posts: state.posts.map((p) => {
          if (p.id !== postId || !p.poll) return p;
          return {
            ...p,
            poll: {
              ...p.poll,
              votedOptionId: isTogglingOff ? null : optionId,
              options: p.poll.options.map((o) => {
                let voteCount = o.voteCount;
                if (previousVote && o.id === previousVote) voteCount -= 1;
                if (!isTogglingOff && o.id === optionId) voteCount += 1;
                return { ...o, voteCount: Math.max(0, voteCount) };
              }),
            },
          };
        }),
      };
    });

    const { error } = await supabase.rpc("cast_poll_vote", {
      p_poll_id: pollId,
      p_option_id: optionId,
    });
    if (error) {
      console.warn("[posts] votePoll failed:", error.message);
      toast.error("Couldn't record your vote. Please try again.");
      set({ posts: previousPosts, myVotesByPoll: previousMyVotesByPoll });
      return;
    }

    // Reconcile with the actual server-side counts in the background.
    // The optimistic +1/-1 above is a good approximation, but polls are
    // inherently multi-user — someone else's concurrent vote could make
    // it drift slightly. This corrects that without blocking or
    // re-flashing the vote that already visibly landed.
    const { data: optionRows } = await supabase
      .from("poll_options")
      .select("id, vote_count")
      .eq("poll_id", pollId);
    if (!optionRows) return;

    const counts: Record<string, number> = {};
    for (const row of optionRows) counts[row.id] = row.vote_count;

    set((state) => ({
      posts: state.posts.map((p) => {
        if (p.id !== postId || !p.poll) return p;
        return {
          ...p,
          poll: {
            ...p.poll,
            options: p.poll.options.map((o) => ({ ...o, voteCount: counts[o.id] ?? o.voteCount })),
          },
        };
      }),
    }));
  },
}));
