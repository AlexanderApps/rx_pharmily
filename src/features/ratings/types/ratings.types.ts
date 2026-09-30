export type RatingEntityType = "user" | "facility" | "organization";

export interface Rating {
  id: string;
  entityType: RatingEntityType;
  entityId: string;
  ratedBy: string;
  ratedByName: string;
  score: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// The denormalized summary carried on the rated entity itself
// (profiles/facilities/organizations.avg_rating + rating_count) —
// what most screens actually need, without fetching every individual
// rating just to show a star average.
export interface RatingSummary {
  avgRating: number;
  ratingCount: number;
}
