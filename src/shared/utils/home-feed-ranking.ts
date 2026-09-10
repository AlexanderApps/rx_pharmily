import { Post } from "@/features/posts/types/posts.types";
import { Ad } from "@/features/ads/types/ads.types";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";
import { DonationCardData } from "@/features/donations/types/donation.types";
import { Job } from "@/features/rxjobs/types/rxjobs.types";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";

// Moved here from app/(tabs)/index.tsx — a screen importing a type from
// a shared utils module is the conventional direction; the reverse
// (utils depending on a screen file) isn't.
export type FeedItem =
  | { kind: "post"; key: string; post: Post }
  | { kind: "ad"; key: string; ad: Ad }
  | { kind: "mediscope"; key: string; request: MediscopeCardData }
  | { kind: "donation"; key: string; donation: DonationCardData }
  | { kind: "job"; key: string; job: Job }
  | { kind: "rfq"; key: string; rfq: RxRfqCardData };

export interface RankingContext {
  // Undefined for a user who hasn't set a region — the region-match
  // bonus below simply never applies, not an error case.
  userRegion?: string;
  // Reuses this app's existing RBAC system (features/auth/hooks/
  // use-permissions.ts) rather than re-deriving relevance from scratch —
  // "can this person actually do anything with this item" is already a
  // solved, existing signal, not a new one to invent for ranking.
  hasPermission: (key: string) => boolean;
}

// Which permission (if any) governs whether this item's kind is
// something the current viewer can act on at all. Posts/ads have no
// gate — every signed-in user can already engage with those regardless
// of verification status.
const KIND_VIEW_PERMISSION: Partial<Record<FeedItem["kind"], string>> = {
  mediscope: "mediscope.view",
  donation: "donations.view",
  job: "jobs.view",
  rfq: "rxrfq.view",
};

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

// Exponential decay: an item from right now scores close to 1, one a
// half-life old scores 0.5, two half-lives old scores 0.25, and so on.
// 3 days is deliberately short — this is a live activity feed for a
// fast-moving marketplace (open requests, jobs, donations), not a
// long-form content archive where week-old items should still compete
// with today's.
const RECENCY_HALF_LIFE_DAYS = 3;
function recencyScore(date: Date): number {
  const age = Math.max(0, daysSince(date));
  return Math.pow(0.5, age / RECENCY_HALF_LIFE_DAYS);
}

function getItemDate(item: FeedItem): Date {
  switch (item.kind) {
    case "post":
      return item.post.createdAt;
    case "ad":
      return item.ad.createdAt;
    case "mediscope":
      return item.request.createdAt;
    case "donation":
      return item.donation.createdAt;
    case "job":
      return item.job.createdAt;
    case "rfq":
      return item.rfq.publishedAt;
  }
}

// Free-text location strings (facility addresses, job locations), not a
// standardized region code — a loose substring match is a deliberately
// simple, honest heuristic here rather than pretending to do real
// geocoding/distance ranking without the data to back it up.
function getItemLocationText(item: FeedItem): string | undefined {
  switch (item.kind) {
    case "mediscope":
      return item.request.facilityLocation;
    case "donation":
      return item.donation.location;
    case "job":
      return item.job.location;
    case "rfq":
      return item.rfq.facilityLocation;
    default:
      return undefined;
  }
}

function getDeadline(item: FeedItem): Date | undefined {
  switch (item.kind) {
    case "mediscope":
      return item.request.submissionDeadline;
    case "rfq":
      return item.rfq.submissionDeadline;
    case "job":
      return item.job.applicationDeadline;
    default:
      return undefined;
  }
}

// A closing-soon boost — small and capped, not enough to override
// recency/relevance entirely, just enough to nudge a genuinely
// time-sensitive item up a little so it's less likely to be missed.
function urgencyBonus(item: FeedItem): number {
  const deadline = getDeadline(item);
  if (!deadline) return 0;
  const daysLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return 0; // fullFeed already filters closed/unpublished items; defensive, not expected
  if (daysLeft <= 2) return 0.3;
  if (daysLeft <= 5) return 0.15;
  return 0;
}

function getResponseCount(item: FeedItem): number | undefined {
  switch (item.kind) {
    case "mediscope":
      return item.request.responseCount;
    case "donation":
      return item.donation.responseCount;
    case "rfq":
      return item.rfq.responseCount;
    default:
      return undefined;
  }
}

// A small nudge for requests that haven't gotten any responses yet.
// This is a marketplace where the actual point is connecting supply and
// demand, not a social feed rewarding whatever's already popular —
// helping an unanswered request get seen is closer to this app's actual
// purpose than surfacing what already has the most attention.
function unansweredBonus(item: FeedItem): number {
  const count = getResponseCount(item);
  return count === 0 ? 0.1 : 0;
}

export function rankFeed(items: FeedItem[], context: RankingContext): FeedItem[] {
  const scored = items.map((item) => {
    let score = recencyScore(getItemDate(item));

    const locationText = getItemLocationText(item);
    if (context.userRegion && locationText?.toLowerCase().includes(context.userRegion.toLowerCase())) {
      score += 0.25;
    }

    const requiredPermission = KIND_VIEW_PERMISSION[item.kind];
    if (requiredPermission && !context.hasPermission(requiredPermission)) {
      // Still included, not filtered out entirely — an unverified user
      // browsing what's out there has real value (it's part of what
      // motivates completing verification), just not surfaced as
      // prominently as things they can actually act on right now.
      score -= 0.5;
    }

    score += urgencyBonus(item);
    score += unansweredBonus(item);

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return interleaveByKind(scored.map((s) => s.item));
}

// Score-sorting alone has no concept of "variety" — several fresh jobs
// posted close together would otherwise cluster at the top as a run of
// 4-5 job cards in a row. This groups by kind (preserving each kind's
// internal score order) then takes one from each kind in a round-robin,
// so the overall top-scored item still leads, but what follows it
// alternates across content types instead of repeating the same one.
function interleaveByKind(items: FeedItem[]): FeedItem[] {
  const buckets = new Map<FeedItem["kind"], FeedItem[]>();
  for (const item of items) {
    const bucket = buckets.get(item.kind);
    if (bucket) bucket.push(item);
    else buckets.set(item.kind, [item]);
  }

  const result: FeedItem[] = [];
  while (result.length < items.length) {
    for (const bucket of buckets.values()) {
      const next = bucket.shift();
      if (next) result.push(next);
    }
  }
  return result;
}
