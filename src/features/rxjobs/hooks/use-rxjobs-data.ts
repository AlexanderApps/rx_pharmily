import { create } from "zustand";
import { format } from "timeago.js";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  ApplicationStatus,
  Job,
  JobApplication,
  JobFormData,
} from "@/features/rxjobs/types/rxjobs.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

function mapJobRow(row: any): Job {
  // companyName is only stored for a custom (unregistered) company —
  // when linked to a real facility or organization, derive the display
  // name from the already-loaded store, same pattern mapDonationRow
  // already uses for donations.facility_id -> facilityName.
  let companyName = row.company_name ?? "";
  if (!row.is_custom) {
    if (row.facility_id) {
      companyName =
        useProfileStore.getState().facilities.find((f) => f.id === row.facility_id)?.name ?? "Unknown facility";
    } else if (row.organization_id) {
      companyName =
        useProfileStore.getState().organizations.find((o) => o.id === row.organization_id)?.name ??
        "Unknown organization";
    }
  }

  return {
    id: row.id,
    title: row.title,
    companyName,
    companyLogo: row.company_logo ?? "",
    location: row.location,
    jobType: row.job_type,
    salaryRange: row.salary_range,
    // Not a stored column — derived fresh from created_at each time this
    // is mapped, rather than frozen at post time the way the mock did.
    postedDate: format(new Date(row.created_at)),
    requirements: row.requirements ?? [],
    description: row.description,
    applicantsCount: row.applicants_count,
    urgency: row.urgency,
    createdAt: new Date(row.created_at),
    applicationDeadline: row.application_deadline ? new Date(row.application_deadline) : undefined,
    postedBy: row.posted_by,
    status: row.status,
    categories: row.categories ?? [],
    facilityId: row.facility_id ?? undefined,
    organizationId: row.organization_id ?? undefined,
    isCustom: row.is_custom,
  };
}

// Expects the applicant's profile info embedded via a join (see the fetch
// actions below) — the applications table itself only stores the id.
function mapApplicationRow(row: any): JobApplication {
  return {
    id: row.id,
    jobId: row.job_id,
    applicantId: row.applicant_id,
    applicantName: row.profiles?.full_name ?? "Unknown",
    coverNote: row.cover_note ?? undefined,
    appliedAt: new Date(row.applied_at),
    status: row.status,
  };
}

const APPLICATION_SELECT = "*, profiles:applicant_id(full_name)";

type RxJobsStore = {
  jobs: Job[];
  applications: JobApplication[];
  savedJobIds: string[];
  isLoading: boolean;

  fetchJobs: () => Promise<void>;
  fetchJob: (id: string) => Promise<void>;
  fetchApplicationsForJob: (jobId: string) => Promise<void>;
  fetchMyApplications: () => Promise<void>;

  getJob: (id: string) => Job | undefined;
  getApplicationsForJob: (jobId: string) => JobApplication[];
  hasApplied: (jobId: string) => boolean;
  isSaved: (jobId: string) => boolean;

  addJob: (data: JobFormData) => Promise<string | undefined>;
  updateJob: (id: string, data: JobFormData) => Promise<boolean>;
  closeJob: (id: string) => Promise<void>;
  cancelJob: (id: string) => Promise<void>;
  reopenJob: (id: string) => Promise<void>;
  deleteJob: (id: string) => Promise<boolean>;

  applyToJob: (jobId: string, coverNote?: string) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => Promise<void>;

  // Bookmarking a job to look at later has no server-side concept behind
  // it (no table, no notification, nothing else references it) — kept as
  // local-only UI state rather than inventing a new table for a feature
  // that was never really "data" so much as a client-side toggle. This
  // means saved jobs don't survive a re-login, unlike everything else in
  // this store.
  toggleSaveJob: (jobId: string) => void;
};

export const useRxJobsStore = create<RxJobsStore>((set, get) => ({
  jobs: [],
  applications: [],
  savedJobIds: [],
  isLoading: false,

  fetchJobs: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) {
      console.warn("[rxjobs] fetchJobs failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ jobs: (data ?? []).map(mapJobRow), isLoading: false });
  },

  fetchJob: async (id) => {
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
    if (error || !data) {
      console.warn("[rxjobs] fetchJob failed:", error?.message);
      return;
    }
    const job = mapJobRow(data);
    set((state) => ({ jobs: [job, ...state.jobs.filter((j) => j.id !== id)] }));
  },

  fetchApplicationsForJob: async (jobId) => {
    const { data, error } = await supabase
      .from("job_applications")
      .select(APPLICATION_SELECT)
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });
    if (error) {
      console.warn("[rxjobs] fetchApplicationsForJob failed:", error.message);
      return;
    }
    const fetched = (data ?? []).map(mapApplicationRow);
    set((state) => ({
      applications: [...state.applications.filter((a) => a.jobId !== jobId), ...fetched],
    }));
  },

  fetchMyApplications: async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("job_applications")
      .select(APPLICATION_SELECT)
      .eq("applicant_id", userId)
      .order("applied_at", { ascending: false });
    if (error) {
      console.warn("[rxjobs] fetchMyApplications failed:", error.message);
      return;
    }
    const fetched = (data ?? []).map(mapApplicationRow);
    set((state) => ({
      applications: [...state.applications.filter((a) => a.applicantId !== userId), ...fetched],
    }));
  },

  getJob: (id) => get().jobs.find((j) => j.id === id),
  getApplicationsForJob: (jobId) => get().applications.filter((a) => a.jobId === jobId),

  hasApplied: (jobId) => {
    // Synchronous by contract (existing screens call this directly in
    // render), so it can only check what's already loaded locally — call
    // fetchApplicationsForJob or fetchMyApplications first if this needs
    // to reflect the server. Filtered by current user specifically,
    // since `applications` may also hold OTHER people's applications
    // (loaded by a job owner reviewing their applicant list) — without
    // this filter, viewing someone else's application would incorrectly
    // make this return true for the current user too.
    const myId = useProfileStore.getState().user.id;
    return get().applications.some((a) => a.jobId === jobId && a.applicantId === myId);
  },

  isSaved: (jobId) => get().savedJobIds.includes(jobId),

  addJob: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("jobs")
      .insert({
        title: data.title,
        company_name: data.isCustom ? data.companyName : null,
        company_logo: data.companyLogo || null,
        location: data.location,
        job_type: data.jobType,
        salary_range: data.salaryRange,
        requirements: data.requirements,
        description: data.description,
        urgency: data.urgency,
        application_deadline: data.applicationDeadline?.toISOString() ?? null,
        posted_by: userId,
        status: "open",
        categories: data.categories,
        facility_id: data.isCustom ? null : data.facilityId ?? null,
        organization_id: data.isCustom ? null : data.organizationId ?? null,
        is_custom: data.isCustom,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[rxjobs] addJob failed:", error?.message);
      return undefined;
    }

    const job = mapJobRow(row);
    set((state) => ({ jobs: [job, ...state.jobs] }));

    useNotificationStore.getState().addNotification(
      "jobs_new_entry",
      "New job posted",
      `${job.companyName} posted "${job.title}".`,
      { pathname: "/jobs/job-market-details", params: { id: job.id } },
    );

    return job.id;
  },

  updateJob: async (id, data) => {
    const { error } = await supabase
      .from("jobs")
      .update({
        title: data.title,
        company_name: data.isCustom ? data.companyName : null,
        company_logo: data.companyLogo || null,
        location: data.location,
        job_type: data.jobType,
        salary_range: data.salaryRange,
        requirements: data.requirements,
        description: data.description,
        urgency: data.urgency,
        application_deadline: data.applicationDeadline?.toISOString() ?? null,
        categories: data.categories,
        facility_id: data.isCustom ? null : data.facilityId ?? null,
        organization_id: data.isCustom ? null : data.organizationId ?? null,
        is_custom: data.isCustom,
      })
      .eq("id", id);
    if (error) {
      console.warn("[rxjobs] updateJob failed:", error.message);
      return false;
    }
    await get().fetchJob(id);
    return true;
  },

  closeJob: async (id) => {
    const { error } = await supabase.from("jobs").update({ status: "closed" }).eq("id", id);
    if (error) {
      console.warn("[rxjobs] closeJob failed:", error.message);
      return;
    }
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? { ...j, status: "closed" as const } : j)) }));
  },

  cancelJob: async (id) => {
    const { error } = await supabase.from("jobs").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      console.warn("[rxjobs] cancelJob failed:", error.message);
      return;
    }
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? { ...j, status: "cancelled" as const } : j)) }));
  },

  reopenJob: async (id) => {
    const { error } = await supabase.from("jobs").update({ status: "open" }).eq("id", id);
    if (error) {
      console.warn("[rxjobs] reopenJob failed:", error.message);
      return;
    }
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? { ...j, status: "open" as const } : j)) }));
  },

  deleteJob: async (id) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) {
      console.warn("[rxjobs] deleteJob failed:", error.message);
      return false;
    }
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== id),
      applications: state.applications.filter((a) => a.jobId !== id),
    }));
    return true;
  },

  applyToJob: async (jobId, coverNote) => {
    if (get().hasApplied(jobId)) return;
    const userId = await requireUserId();

    const { data: row, error } = await supabase
      .from("job_applications")
      .insert({ job_id: jobId, applicant_id: userId, cover_note: coverNote ?? null })
      .select(APPLICATION_SELECT)
      .single();
    if (error || !row) {
      console.warn("[rxjobs] applyToJob failed:", error?.message);
      return;
    }

    const application = mapApplicationRow(row);
    await supabase
      .from("jobs")
      .update({ applicants_count: (get().jobs.find((j) => j.id === jobId)?.applicantsCount ?? 0) + 1 })
      .eq("id", jobId);

    set((state) => ({
      applications: [...state.applications, application],
      jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, applicantsCount: j.applicantsCount + 1 } : j)),
    }));

    const job = get().jobs.find((j) => j.id === jobId);
    if (job && job.postedBy === userId) {
      useNotificationStore.getState().addNotification(
        "jobs_application_received",
        "New applicant",
        `${application.applicantName} applied to "${job.title}".`,
        { pathname: "/jobs/job-details", params: { id: job.id } },
      );
    }
  },

  updateApplicationStatus: async (applicationId, status) => {
    const { error } = await supabase.from("job_applications").update({ status }).eq("id", applicationId);
    if (error) {
      console.warn("[rxjobs] updateApplicationStatus failed:", error.message);
      return;
    }

    set((state) => ({
      applications: state.applications.map((a) => (a.id === applicationId ? { ...a, status } : a)),
    }));

    const application = get().applications.find((a) => a.id === applicationId);
    const userId = await requireUserId();
    if (application && application.applicantId === userId) {
      const job = get().jobs.find((j) => j.id === application.jobId);
      useNotificationStore.getState().addNotification(
        "jobs_application_status",
        "Your application status changed",
        `Your application${job ? ` for "${job.title}"` : ""} is now "${status}".`,
        { pathname: "/jobs/job-market-details", params: { id: application.jobId } },
      );
    }
  },

  toggleSaveJob: (jobId) => {
    set((state) => ({
      savedJobIds: state.savedJobIds.includes(jobId)
        ? state.savedJobIds.filter((id) => id !== jobId)
        : [...state.savedJobIds, jobId],
    }));
  },
}));
