// RxRFQ's submissionDeadline is always set (a required field on the
// form), so a missing value here would be a data anomaly, not a normal
// case — treated as "not past deadline" (visible) rather than hidden,
// since silently hiding a malformed item is worse than showing one.
export function isRxRfqPastDeadline(submissionDeadline: Date | string): boolean {
  return new Date(submissionDeadline).getTime() < Date.now();
}

// Job.applicationDeadline is optional, and the app has no fallback
// value for it the way MediScope does — a job posted with no deadline
// simply has nothing to compare against, so it's never excluded on
// that basis.
export function isJobPastDeadline(applicationDeadline?: Date | string): boolean {
  if (!applicationDeadline) return false;
  return new Date(applicationDeadline).getTime() < Date.now();
}

// MediScope's submissionDeadline is optional — unlike Jobs, a request
// with none is NOT treated as "never expires". Instead it falls back to
// createdAt + the app_settings-configured window (default 30 days, see
// the mediscope_default_deadline_days migration and its admin toggle),
// so an old, never-updated request eventually drops out of the feed and
// marketplace even if its creator never set an explicit deadline. This
// returns that actual computed date — isMediscopePastDeadline below is
// just this compared against now, and the mediscope card uses this
// directly to display a real date rather than only a yes/no.
export function getMediscopeEffectiveDeadline(
  submissionDeadline: Date | string | undefined,
  createdAt: Date | string,
  defaultDeadlineDays: number,
): Date {
  return submissionDeadline
    ? new Date(submissionDeadline)
    : new Date(new Date(createdAt).getTime() + defaultDeadlineDays * 24 * 60 * 60 * 1000);
}

export function isMediscopePastDeadline(
  submissionDeadline: Date | string | undefined,
  createdAt: Date | string,
  defaultDeadlineDays: number,
): boolean {
  const effectiveDeadline = getMediscopeEffectiveDeadline(submissionDeadline, createdAt, defaultDeadlineDays);
  return effectiveDeadline.getTime() < Date.now();
}
