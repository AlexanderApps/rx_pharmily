export type JobType =
  | "Locum Shift"
  | "Full-Time"
  | "Part-Time"
  | "MSL / Industrial"
  | "Hospital Specialist";

export type JobUrgency = "Immediate" | "Standard";

// "closed" = search ended normally (e.g. position filled); "cancelled" =
// withdrawn by the poster before it was filled. Distinct reasons, so a
// single boolean isn't enough to represent them.
export type JobStatus = "open" | "closed" | "cancelled";

// The model as given, kept intact as the public contract for a listing.
// companyName here is always populated by mapJobRow — for a custom
// (unregistered) company it's the stored free-text name; for a job
// linked to a real facility or organization it's derived at read time
// from the already-loaded facilities/organizations store (same pattern
// already used for donations' facilityName), not stored redundantly in
// the DB. JobFormData below is the one place this is genuinely
// optional, since the form only supplies it when isCustom is chosen.
export interface JobListing {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string;
  location: string;
  jobType: JobType;
  salaryRange: string;
  postedDate: string;
  requirements: string[];
  description: string;
  applicantsCount: number;
  urgency: JobUrgency;
}

// Additions needed to make the feature functional: a real sortable
// timestamp (postedDate above is just display text), an optional
// application deadline (mirrors the deadline pattern used by RxRFQs), and
// enough identity to know who posted it and where it's based.
export interface Job extends JobListing {
  createdAt: Date;
  applicationDeadline?: Date;
  postedBy: string;
  status: JobStatus;
  categories: string[];
  // Exactly one of these three is meaningful at a time, matching the DB's
  // own check constraint: isCustom true -> companyName set, both ids
  // null; isCustom false -> companyName undefined, exactly one of
  // facilityId/organizationId set.
  facilityId?: string;
  organizationId?: string;
  isCustom: boolean;
}

// Shape used by the post-a-job form — everything except server-assigned
// identity fields (id, postedDate, applicantsCount, createdAt, postedBy).
export interface JobFormData {
  title: string;
  companyName?: string;
  companyLogo: string;
  location: string;
  jobType: JobType;
  salaryRange: string;
  requirements: string[];
  description: string;
  urgency: JobUrgency;
  applicationDeadline?: Date;
  categories: string[];
  facilityId?: string;
  organizationId?: string;
  isCustom: boolean;
}

export type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "hired";

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  coverNote?: string;
  appliedAt: Date;
  status: ApplicationStatus;
}

// Which registered entity (if any) actually posted this job, for
// ClickableAvatar/PublicProfileCard. postedBy is the *user account* that
// created the listing — never a facility or organization id — so it's
// never the right id to look a profile up by. Per Job's own isCustom
// contract: isCustom true means no registered entity exists at all
// (companyName was hand-typed); isCustom false means exactly one of
// facilityId/organizationId is set. In the isCustom case, postedBy is
// still passed through deliberately — it won't match anything in the
// facilities/organizations lists, so PublicProfileCard's lookup
// correctly falls through to ClickableAvatar's fallbackName (the typed
// companyName) instead of showing a wrong or empty profile.
export function getJobPosterEntity(job: Job): { entityType: "facility" | "organization"; entityId: string } {
  if (job.organizationId) return { entityType: "organization", entityId: job.organizationId };
  if (job.facilityId) return { entityType: "facility", entityId: job.facilityId };
  return { entityType: "facility", entityId: job.postedBy };
}
