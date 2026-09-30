import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { Rating, RatingEntityType } from "@/features/ratings/types/ratings.types";

function entityKey(entityType: RatingEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

function mapRatingRow(row: any): Rating {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    ratedBy: row.rated_by,
    ratedByName: row.profiles?.full_name ?? "Unknown",
    score: row.score,
    comment: row.comment ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

type RatingsStore = {
  ratingsByEntity: Record<string, Rating[]>;
  isLoading: boolean;

  fetchRatingsForEntity: (entityType: RatingEntityType, entityId: string) => Promise<void>;
  getRatingsForEntity: (entityType: RatingEntityType, entityId: string) => Rating[];
  getMyRatingFor: (entityType: RatingEntityType, entityId: string) => Rating | undefined;

  // Insert-or-update in one call, relying on the DB's own
  // unique(entity_type, entity_id, rated_by) constraint — a second
  // rating from the same person for the same entity replaces their
  // first, it doesn't stack a new one.
  submitRating: (
    entityType: RatingEntityType,
    entityId: string,
    score: number,
    comment?: string,
  ) => Promise<boolean>;
  deleteRating: (entityType: RatingEntityType, entityId: string) => Promise<boolean>;
};

export const useRatingsStore = create<RatingsStore>((set, get) => ({
  ratingsByEntity: {},
  isLoading: false,

  fetchRatingsForEntity: async (entityType, entityId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("ratings")
      .select("*, profiles:rated_by(id, full_name)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    set({ isLoading: false });
    if (error) {
      console.warn("[ratings] fetchRatingsForEntity failed:", error.message);
      return;
    }
    set((state) => ({
      ratingsByEntity: {
        ...state.ratingsByEntity,
        [entityKey(entityType, entityId)]: (data ?? []).map(mapRatingRow),
      },
    }));
  },

  getRatingsForEntity: (entityType, entityId) => get().ratingsByEntity[entityKey(entityType, entityId)] ?? [],

  getMyRatingFor: (entityType, entityId) => {
    const userId = useProfileStore.getState().user.id;
    return get()
      .getRatingsForEntity(entityType, entityId)
      .find((r) => r.ratedBy === userId);
  },

  submitRating: async (entityType, entityId, score, comment) => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("ratings")
      .upsert(
        {
          entity_type: entityType,
          entity_id: entityId,
          rated_by: userId,
          score,
          comment: comment?.trim() || null,
        },
        { onConflict: "entity_type,entity_id,rated_by" },
      )
      .select("*, profiles:rated_by(id, full_name)")
      .single();
    if (error || !data) {
      console.warn("[ratings] submitRating failed:", error?.message);
      return false;
    }
    const key = entityKey(entityType, entityId);
    set((state) => {
      const existing = state.ratingsByEntity[key] ?? [];
      const mapped = mapRatingRow(data);
      const withoutMine = existing.filter((r) => r.ratedBy !== userId);
      return { ratingsByEntity: { ...state.ratingsByEntity, [key]: [mapped, ...withoutMine] } };
    });
    return true;
  },

  deleteRating: async (entityType, entityId) => {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("rated_by", userId);
    if (error) {
      console.warn("[ratings] deleteRating failed:", error.message);
      return false;
    }
    const key = entityKey(entityType, entityId);
    set((state) => ({
      ratingsByEntity: {
        ...state.ratingsByEntity,
        [key]: (state.ratingsByEntity[key] ?? []).filter((r) => r.ratedBy !== userId),
      },
    }));
    return true;
  },
}));
