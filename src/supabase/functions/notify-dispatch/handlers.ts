// deno-lint-ignore-file no-explicit-any
import { supabaseAdmin, insertNotification, insertBroadcastNotification } from "./helpers.ts";
import type { WebhookPayload } from "./types.ts";

// ============================================================================
// RxRFQ — broadcast on publish, single-recipient on response.
// ============================================================================

async function handleRxrfqs(payload: WebhookPayload) {
  if (payload.type !== "UPDATE") return;
  const record = payload.record!;
  const old = payload.old_record!;

  // Same transition check the client used: fire only the FIRST time
  // this RFQ goes live, not on every subsequent update that happens to
  // already be published (closing, extending a deadline, etc).
  if (record.status === "published" && old.status !== "published") {
    await insertBroadcastNotification(
      record.created_by,
      "rxrfq_new_entry",
      "New RxRFQ posted",
      `${record.code} — ${record.description || "a new request for quote"} was posted.`,
      { pathname: "/rfqs/rxrfq-market-details", params: { id: record.id } },
    );
  }
}

async function handleRxrfqResponses(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  const { data: rfq, error: rfqError } = await supabaseAdmin
    .from("rxrfqs")
    .select("id, code, created_by")
    .eq("id", record.rxrfq_id)
    .single();
  if (rfqError || !rfq) {
    console.error("[notify-dispatch] handleRxrfqResponses: RFQ lookup failed", rfqError);
    return;
  }

  const { data: vendor } = await supabaseAdmin
    .from("facilities")
    .select("name")
    .eq("id", record.vendor_facility_id)
    .single();

  await insertNotification(
    rfq.created_by,
    record.created_by,
    "rxrfq_response_received",
    "New response on your RxRFQ",
    `${vendor?.name ?? "A vendor"} responded to ${rfq.code}.`,
    { pathname: "/rfqs/rxrfq-details-screen", params: { id: rfq.id } },
  );
}

async function handleRxrfqAwardDecision(payload: WebhookPayload) {
  if (payload.type !== "UPDATE") return;
  const record = payload.record!;
  const old = payload.old_record!;

  if (record.status !== "awarded" || old.status === "awarded") return;
  if (!record.awarded_vendor_id) return;

  // Despite the column name, awarded_vendor_id stores a
  // rxrfq_responses.id, not a facility id directly — confirmed against
  // the client-side awardRxRfqResponse implementation, which sets it to
  // the response's own id, not the vendor facility's.
  const { data: response, error: responseError } = await supabaseAdmin
    .from("rxrfq_responses")
    .select("id, created_by")
    .eq("id", record.awarded_vendor_id)
    .single();
  if (responseError || !response) {
    console.error("[notify-dispatch] handleRxrfqAwardDecision: response lookup failed", responseError);
    return;
  }

  await insertNotification(
    response.created_by,
    null,
    "rxrfq_award_decision",
    "Your quote was awarded",
    `Your response to ${record.code} was awarded.`,
    { pathname: "/rfqs/response-details", params: { id: response.id } },
  );
}

// ============================================================================
// Donations — broadcast immediately on creation (no draft/publish step).
// ============================================================================

async function handleDonations(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  const { data: facility } = await supabaseAdmin
    .from("facilities")
    .select("name")
    .eq("id", record.facility_id)
    .single();

  await insertBroadcastNotification(
    record.created_by,
    "donation_new_entry",
    "New donation posted",
    `${facility?.name ?? "A facility"} posted a new donation (${record.code}).`,
    { pathname: "/donations/donation-market-details", params: { id: record.id } },
  );
}

async function handleDonationResponses(payload: WebhookPayload) {
  const record = payload.record!;

  const { data: donation, error: donationError } = await supabaseAdmin
    .from("donations")
    .select("id, code, created_by")
    .eq("id", record.donation_id)
    .single();
  if (donationError || !donation) {
    console.error("[notify-dispatch] handleDonationResponses: donation lookup failed", donationError);
    return;
  }

  if (payload.type === "INSERT") {
    const { data: responder } = await supabaseAdmin
      .from("facilities")
      .select("name")
      .eq("id", record.responder_facility_id)
      .single();

    await insertNotification(
      donation.created_by,
      record.created_by,
      "donation_claim_received",
      "New claim on your donation",
      `${responder?.name ?? "A facility"} claimed items from ${donation.code}.`,
      { pathname: "/donations/donation-details", params: { id: donation.id } },
    );
    return;
  }

  if (payload.type === "UPDATE") {
    const old = payload.old_record!;
    if (old.status !== "pending" || record.status === "pending") return;

    await insertNotification(
      record.created_by,
      null,
      "donation_claim_decision",
      record.status === "approved" ? "Your claim was approved" : "Your claim was declined",
      `Your claim on ${donation.code} was ${record.status === "approved" ? "approved" : "declined"}.`,
      { pathname: "/donations/donation-market-details", params: { id: donation.id } },
    );
  }
}

// ============================================================================
// MediScope — same broadcast-on-publish shape as RxRFQ.
// ============================================================================

async function handleMediscopeRequests(payload: WebhookPayload) {
  if (payload.type !== "UPDATE") return;
  const record = payload.record!;
  const old = payload.old_record!;

  if (record.status === "published" && old.status !== "published") {
    const { data: facility } = await supabaseAdmin
      .from("facilities")
      .select("name")
      .eq("id", record.facility_id)
      .single();

    await insertBroadcastNotification(
      record.created_by,
      "mediscope_new_entry",
      "New MediScope request",
      `${facility?.name ?? "A facility"} is searching for ${record.product}.`,
      { pathname: "/mediscope/mediscope-market-details", params: { id: record.id } },
    );
  }
}

async function handleMediscopeResponses(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  const { data: request, error: requestError } = await supabaseAdmin
    .from("mediscope_requests")
    .select("id, product, created_by")
    .eq("id", record.request_id)
    .single();
  if (requestError || !request) {
    console.error("[notify-dispatch] handleMediscopeResponses: request lookup failed", requestError);
    return;
  }

  const { data: vendor } = await supabaseAdmin
    .from("facilities")
    .select("name")
    .eq("id", record.vendor_facility_id)
    .single();

  await insertNotification(
    request.created_by,
    record.created_by,
    "mediscope_response_received",
    "New response on your MediScope request",
    `${vendor?.name ?? "A vendor"} responded to your search for ${request.product}.`,
    { pathname: "/mediscope/mediscope-details", params: { id: request.id } },
  );
}

// ============================================================================
// Jobs — broadcast immediately on posting (no draft step, same as
// donations), single recipient on both a new application and any
// status change to an existing one.
// ============================================================================

async function handleJobs(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  await insertBroadcastNotification(
    record.posted_by,
    "jobs_new_entry",
    "New job posted",
    `${record.company_name} posted "${record.title}".`,
    { pathname: "/jobs/job-market-details", params: { id: record.id } },
  );
}

async function handleJobApplications(payload: WebhookPayload) {
  const record = payload.record!;

  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("id, title, posted_by")
    .eq("id", record.job_id)
    .single();
  if (jobError || !job) {
    console.error("[notify-dispatch] handleJobApplications: job lookup failed", jobError);
    return;
  }

  if (payload.type === "INSERT") {
    const { data: applicant } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", record.applicant_id)
      .single();

    await insertNotification(
      job.posted_by,
      record.applicant_id,
      "jobs_application_received",
      "New applicant",
      `${applicant?.full_name ?? "Someone"} applied to "${job.title}".`,
      { pathname: "/jobs/job-details", params: { id: job.id } },
    );
    return;
  }

  if (payload.type === "UPDATE") {
    const old = payload.old_record!;
    // Fires on every status change, not just the first one away from
    // "submitted" — each stage (reviewing, shortlisted, hired, rejected)
    // is its own meaningful update to the applicant, unlike a one-time
    // "published" event. Matches the client-side version's behavior
    // exactly (it never had a transition guard either).
    if (record.status === old.status) return;

    await insertNotification(
      record.applicant_id,
      null,
      "jobs_application_status",
      "Your application status changed",
      `Your application for "${job.title}" is now "${record.status}".`,
      { pathname: "/jobs/job-market-details", params: { id: job.id } },
    );
  }
}

// ============================================================================
// Ads — single recipient on the moderation decision and on new comments.
// Only pending→approved and pending→rejected notify — matches the
// client-side version exactly, which never wired suspend/ban to this
// category either.
// ============================================================================

async function handleAds(payload: WebhookPayload) {
  if (payload.type !== "UPDATE") return;
  const record = payload.record!;
  const old = payload.old_record!;

  if (old.status !== "pending") return;
  if (record.status !== "approved" && record.status !== "rejected") return;

  await insertNotification(
    record.advertiser_id,
    record.reviewed_by ?? null,
    "ads_status_decision",
    record.status === "approved" ? "Your ad was approved" : "Your ad was rejected",
    record.status === "approved"
      ? `"${record.title}" is now live.`
      : `"${record.title}" was rejected${record.status_reason ? `: ${record.status_reason}` : "."}`,
    { pathname: "/ads/ad-details", params: { id: record.id } },
  );
}

async function handleAdComments(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  const { data: ad, error: adError } = await supabaseAdmin
    .from("ads")
    .select("id, title, advertiser_id")
    .eq("id", record.ad_id)
    .single();
  if (adError || !ad) {
    console.error("[notify-dispatch] handleAdComments: ad lookup failed", adError);
    return;
  }

  const { data: author } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", record.author_id)
    .single();

  await insertNotification(
    ad.advertiser_id,
    record.author_id,
    "ads_new_comment",
    "New comment on your ad",
    `${author?.full_name ?? "Someone"} commented on "${ad.title}".`,
    { pathname: "/ads/ad-details", params: { id: ad.id } },
  );
}

// ============================================================================
// RxHelp — consult and pharmacist-question responses, both single
// recipient via a parent-table lookup. Neither response table tracks
// who responded beyond a name string (consultant_name/pharmacist_name),
// since only admins can respond at all — matches the client-side
// version, which used the same name fields rather than a user id.
// ============================================================================

async function handleConsultResponses(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  const { data: request, error: requestError } = await supabaseAdmin
    .from("consult_requests")
    .select("id, subject, created_by")
    .eq("id", record.request_id)
    .single();
  if (requestError || !request) {
    console.error("[notify-dispatch] handleConsultResponses: request lookup failed", requestError);
    return;
  }

  await insertNotification(
    request.created_by,
    null,
    "consult_response_received",
    "Consultant replied",
    `${record.consultant_name} replied to your request: "${request.subject}".`,
    { pathname: "/help/consult-details", params: { id: request.id } },
  );
}

async function handlePharmacistAnswers(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  const { data: question, error: questionError } = await supabaseAdmin
    .from("pharmacist_questions")
    .select("id, medication_name, created_by")
    .eq("id", record.question_id)
    .single();
  if (questionError || !question) {
    console.error("[notify-dispatch] handlePharmacistAnswers: question lookup failed", questionError);
    return;
  }

  await insertNotification(
    question.created_by,
    null,
    "pharmacist_response_received",
    "Your question was answered",
    `${record.pharmacist_name} answered your question${question.medication_name ? ` about ${question.medication_name}` : ""}.`,
    { pathname: "/help/question-details", params: { id: question.id } },
  );
}

async function handleRxlinkRequests(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  await insertBroadcastNotification(
    record.created_by,
    "rxlink_new_entry",
    "New RxLink request",
    `A new medication search request (${record.code}) needs a response.`,
    { pathname: "/admin/rxlink-requests", params: { id: record.id } },
    { adminOnly: true },
  );
}

async function handleRxlinkResponses(payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const record = payload.record!;

  const { data: request, error: requestError } = await supabaseAdmin
    .from("rxlink_requests")
    .select("id, code, created_by")
    .eq("id", record.request_id)
    .single();
  if (requestError || !request) {
    console.error("[notify-dispatch] handleRxlinkResponses: request lookup failed", requestError);
    return;
  }

  await insertNotification(
    request.created_by,
    record.responder_id,
    "rxlink_response_received",
    "New response on your RxLink request",
    `An admin responded to your request ${request.code}.`,
    { pathname: "/rxlink/request-details", params: { id: request.id } },
  );
}

// ============================================================================
// Formulary requests — single recipient, decision on an existing row.
// ============================================================================

async function handleFormularyRequests(payload: WebhookPayload) {
  if (payload.type !== "UPDATE") return;
  const record = payload.record!;
  const old = payload.old_record!;

  // Only a genuine decision — pending moving to something else — not
  // every incidental field update a request row might go through.
  if (old.status !== "pending" || record.status === "pending") return;

  const decisionText =
    record.status === "merged"
      ? `"${record.product_name}" is now available in the product catalog.`
      : record.status === "approved"
        ? `"${record.product_name}" was approved and is awaiting catalog cleanup.`
        : `"${record.product_name}" was not approved${record.review_comment ? `: ${record.review_comment}` : "."}`;

  await insertNotification(
    record.created_by,
    record.reviewed_by ?? null,
    "formulary_request_decision",
    record.status === "approved" || record.status === "merged"
      ? "Formulary request approved"
      : "Formulary request declined",
    decisionText,
    { pathname: "/formulary" },
  );
}

// ============================================================================
// Facility membership requests — single recipient both ways: the
// facility's admin on a new request, the requester on the decision.
// ============================================================================

async function handleFacilityMembershipRequests(payload: WebhookPayload) {
  const record = payload.record!;

  if (payload.type === "INSERT") {
    const { data: facility } = await supabaseAdmin
      .from("facilities")
      .select("id, name, admin_user_id")
      .eq("id", record.facility_id)
      .single();
    if (!facility) return;

    const { data: requester } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", record.requested_by)
      .single();

    await insertNotification(
      facility.admin_user_id,
      record.requested_by,
      "facility_membership_request_received",
      "New membership request",
      `${requester?.full_name ?? "Someone"} wants to join ${facility.name}.`,
      { pathname: "/profile/facility-profile", params: { id: facility.id } },
    );
    return;
  }

  if (payload.type === "UPDATE") {
    const old = payload.old_record!;
    if (old.status !== "pending" || record.status === "pending") return;

    const { data: facility } = await supabaseAdmin
      .from("facilities")
      .select("id, name, admin_user_id")
      .eq("id", record.facility_id)
      .single();

    await insertNotification(
      record.requested_by,
      facility?.admin_user_id ?? null,
      "facility_membership_decision",
      record.status === "approved" ? "Membership request approved" : "Membership request declined",
      record.status === "approved"
        ? `You're now a member of ${facility?.name ?? "the facility"}.`
        : `Your request to join ${facility?.name ?? "the facility"} was not approved${record.review_comment ? `: ${record.review_comment}` : "."}`,
      { pathname: "/profile/facility-profile", params: { id: record.facility_id } },
    );
  }
}

// ============================================================================
// Facility/organization creation decisions — single recipient, decision
// on an existing row. Both tables share the same shape (requested_by,
// status: pending/approved/rejected), so these two handlers are nearly
// identical — kept separate rather than merged into one parameterized
// function, since the two tables' resulting-entity columns differ
// (resulting_facility_id vs whatever the organization table's
// equivalent is) and a shared handler would need to branch on that
// anyway.
// ============================================================================

async function handleFacilityCreationRequests(payload: WebhookPayload) {
  if (payload.type !== "UPDATE") return;
  const record = payload.record!;
  const old = payload.old_record!;

  if (old.status !== "pending" || record.status === "pending") return;

  await insertNotification(
    record.requested_by,
    record.reviewed_by ?? null,
    "facility_creation_decision",
    record.status === "approved" ? "Facility approved" : "Facility request declined",
    record.status === "approved"
      ? `"${record.name}" has been created. Submit KYC documents to get it verified.`
      : `"${record.name}" was not approved${record.review_comment ? `: ${record.review_comment}` : "."}`,
    record.status === "approved" && record.resulting_facility_id
      ? { pathname: "/profile/facility-profile", params: { id: record.resulting_facility_id } }
      : { pathname: "/profile" },
  );
}

async function handleOrganizationCreationRequests(payload: WebhookPayload) {
  if (payload.type !== "UPDATE") return;
  const record = payload.record!;
  const old = payload.old_record!;

  if (old.status !== "pending" || record.status === "pending") return;

  await insertNotification(
    record.requested_by,
    record.reviewed_by ?? null,
    "organization_creation_decision",
    record.status === "approved" ? "Organization approved" : "Organization request declined",
    record.status === "approved"
      ? `"${record.name}" has been created. Submit KYC documents to get it verified.`
      : `"${record.name}" was not approved${record.review_comment ? `: ${record.review_comment}` : "."}`,
    record.status === "approved" && record.resulting_organization_id
      ? { pathname: "/profile/organization-profile", params: { id: record.resulting_organization_id } }
      : { pathname: "/profile" },
  );
}

// ============================================================================
// Facility-to-organization link requests — single recipient both ways:
// the target organization's admin on a new request, the requesting
// facility's owner on the decision (they're the one who submitted it,
// not the org admin who decides it).
// ============================================================================

async function handleFacilityOrganizationRequests(payload: WebhookPayload) {
  const record = payload.record!;

  if (payload.type === "INSERT") {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id, name, admin_user_id")
      .eq("id", record.organization_id)
      .single();
    const { data: facility } = await supabaseAdmin
      .from("facilities")
      .select("name")
      .eq("id", record.facility_id)
      .single();
    if (!org) return;

    await insertNotification(
      org.admin_user_id,
      record.requested_by,
      "facility_organization_request_received",
      "New facility-to-organization request",
      `${facility?.name ?? "A facility"} wants to join ${org.name}.`,
      { pathname: "/profile/organization-profile", params: { id: org.id } },
    );
    return;
  }

  if (payload.type === "UPDATE") {
    const old = payload.old_record!;
    if (old.status !== "pending" || record.status === "pending") return;

    const { data: facility } = await supabaseAdmin
      .from("facilities")
      .select("name")
      .eq("id", record.facility_id)
      .single();
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", record.organization_id)
      .single();

    await insertNotification(
      record.requested_by,
      record.reviewed_by ?? null,
      "facility_organization_decision",
      record.status === "approved" ? "Facility joined organization" : "Facility-to-organization request declined",
      record.status === "approved"
        ? `${facility?.name ?? "The facility"} now belongs to ${org?.name ?? "the organization"}.`
        : `${facility?.name ?? "The facility"}'s request to join ${org?.name ?? "the organization"} was not approved${record.review_comment ? `: ${record.review_comment}` : "."}`,
      { pathname: "/profile/facility-profile", params: { id: record.facility_id } },
    );
  }
}

// ============================================================================
// KYC decisions on a user's own profile — the recipient IS the row.
// ============================================================================

async function handleProfiles(payload: WebhookPayload) {
  if (payload.type !== "UPDATE") return;
  const record = payload.record!;
  const old = payload.old_record!;

  if (record.kyc_status === old.kyc_status) return;
  if (record.kyc_status !== "verified" && record.kyc_status !== "rejected") return;

  await insertNotification(
    record.id,
    record.kyc_reviewed_by ?? null,
    "kyc_decision",
    record.kyc_status === "verified" ? "You are verified" : "Verification needs attention",
    record.kyc_status === "verified"
      ? "Your submission has been verified."
      : `Your submission was not approved${record.kyc_rejection_reason ? `: ${record.kyc_rejection_reason}` : "."}`,
    { pathname: "/profile/user-profile" },
  );
}

// ============================================================================
// Router — dispatches by table name. See README.md for the full mapping
// of every remaining NotificationCategory to its trigger table/condition
// and how to add a handler for it following these same patterns.
// ============================================================================

export async function dispatch(payload: WebhookPayload): Promise<void> {
  switch (payload.table) {
    // Both watch the same table's UPDATE event for different, mutually
    // exclusive transitions (draft→published vs →awarded) — each
    // handler checks its own condition and no-ops if it doesn't match,
    // so calling both unconditionally here is safe and not wasteful.
    case "rxrfqs":
      await handleRxrfqs(payload);
      await handleRxrfqAwardDecision(payload);
      return;
    case "rxrfq_responses":
      return handleRxrfqResponses(payload);
    case "donations":
      return handleDonations(payload);
    case "donation_responses":
      return handleDonationResponses(payload);
    case "mediscope_requests":
      return handleMediscopeRequests(payload);
    case "mediscope_responses":
      return handleMediscopeResponses(payload);
    case "jobs":
      return handleJobs(payload);
    case "job_applications":
      return handleJobApplications(payload);
    case "ads":
      return handleAds(payload);
    case "ad_comments":
      return handleAdComments(payload);
    case "consult_responses":
      return handleConsultResponses(payload);
    case "pharmacist_answers":
      return handlePharmacistAnswers(payload);
    case "rxlink_requests":
      return handleRxlinkRequests(payload);
    case "rxlink_responses":
      return handleRxlinkResponses(payload);
    case "formulary_requests":
      return handleFormularyRequests(payload);
    case "facility_membership_requests":
      return handleFacilityMembershipRequests(payload);
    case "facility_creation_requests":
      return handleFacilityCreationRequests(payload);
    case "organization_creation_requests":
      return handleOrganizationCreationRequests(payload);
    case "facility_organization_requests":
      return handleFacilityOrganizationRequests(payload);
    case "profiles":
      return handleProfiles(payload);
    default:
      console.warn(`[notify-dispatch] no handler registered for table "${payload.table}"`);
  }
}
