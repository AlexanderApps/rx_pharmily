export type IncotermOption = {
  code: string;
  label?: string;
  description: string;
  category: "Any Mode" | "Sea/Waterway Only" | "None";
};

// Generic visibility types — structurally identical to RxRfqVisibilityRule/
// MediscopeVisibilityRule/DonationVisibilityRule (each feature keeps its
// own named type for its own store/DB mapping), so the shared visibility
// UI components in shared/components/visibility/ can accept any of them
// without a feature needing to import another feature's types. Only
// rxrfq's own visibility-manager/add-rule-sheet/rules-badgelist
// components stay untouched and RxRfq-specific — donations and mediscope
// use the generic versions here instead of duplicating that UI a second
// and third time.
export type VisibilityScope = "All" | "Restricted";

export type VisibilityRuleType = "Region" | "Facility Type" | "Specific Facility";

export interface VisibilityRule {
  id?: string;
  ruleType: VisibilityRuleType;
  region?: string;
  facilityType?: string;
  facility?: string;
}
