import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import Input from "@/shared/components/input";
import EmptyState from "@/shared/components/empty-state";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface Section {
  key: string;
  heading: string;
  icon: IconName;
  color: string;
  body: string[];
}

// Colors and icons are deliberately the same ones already used for each
// feature elsewhere in the app (Services quick actions, the home
// screen's limited view, feed badges) — this guide should look like it
// belongs to the same product, not introduce a second visual language
// for the same features.
const GETTING_STARTED: Section = {
  key: "getting-started",
  heading: "Getting Started",
  icon: "rocket-launch-outline",
  color: "#2563eb",
  body: [
    "Create an account and choose your role — an individual professional, a facility (pharmacy or hospital), or an organization. Facilities and organizations can go through KYC verification, which unlocks a verified badge and access to features that require trust, like posting RFQs others can respond to.",
    "Verify your phone number from your profile to add an extra layer of trust. Once verified, it also needs a brief admin approval step before showing as fully verified.",
    "Once a facility or organization profile is verified, its key details (name, location, license info) can no longer be edited directly — instead, use Request Profile Update from the profile screen, and an admin reviews the change.",
  ],
};

interface Group {
  label: string;
  sections: Section[];
}

const GROUPS: Group[] = [
  {
    label: "Marketplace",
    sections: [
      {
        key: "rxrfqs",
        heading: "RxRFQs (Requests for Quotation)",
        icon: "file-document-outline",
        color: "#16a34a",
        body: [
          "Post an RxRFQ when you need a quote on medications or supplies — tap + on the RxRFQs screen, list what you need, set a submission deadline, and publish. You can restrict who sees it by region, facility type, or specific facilities using the visibility settings.",
          "Vendors respond with a quote (price, quantities, any additional costs like delivery or handling). Review responses from your RFQ's details page and award the one you choose.",
          "My RxRFQs shows everything you've posted, filterable by Published, Draft, and Closed.",
        ],
      },
      {
        key: "mediscope",
        heading: "MediScope",
        icon: "heart-search",
        color: "#16a34a",
        body: [
          "MediScope requests are for locating a specific medication or item — post one describing what you're looking for, and other facilities respond with availability, cost, and where to get it.",
          "Mark a response as fulfilled once you've sourced what you needed, which closes out the request.",
        ],
      },
      {
        key: "donations",
        heading: "Donations",
        icon: "heart-outline",
        color: "#9333ea",
        body: [
          "Post a donation to give away medications or supplies your facility no longer needs — list each item with quantity and expiry date.",
          "To receive a donation, open the listing and tap Claim Items, choosing what you need and how much. The donor reviews and approves or rejects claims from their donation's details page.",
        ],
      },
      {
        key: "rxjobs",
        heading: "RxJobs",
        icon: "office-building",
        color: "#2563eb",
        body: [
          "Browse open positions or post one from RxJobs. A job posting can be attached to your facility or organization, or listed under a custom company name.",
          "Apply to a listing with a cover note; track your applications, or — if you posted the job — review applicants, from My Jobs.",
        ],
      },
      {
        key: "rxads",
        heading: "RxAds",
        icon: "bullhorn-outline",
        color: "#dc2626",
        body: [
          "RxAds lets you promote a product or service to the network. Submit an ad with your content and payment; it goes live once an admin reviews and approves it, usually within a business day.",
        ],
      },
    ],
  },
  {
    label: "Community & Messaging",
    sections: [
      {
        key: "home-feed",
        heading: "Home Feed & Community",
        icon: "home-outline",
        color: "#2563eb",
        body: [
          "The home feed shows a mix of posts, RxRFQs, MediScope requests, donations, jobs, and ads from your network, ranked by recency and relevance to your region.",
          "Tap Share something with the community to write a post. Community (under Posts) is where the broader conversation — likes, comments, polls — happens outside of any specific marketplace listing.",
        ],
      },
      {
        key: "rxlink",
        heading: "RxLink",
        icon: "pill",
        color: "#0d9488",
        body: [
          "RxLink connects you with prescriptions and medication search requests — submit a request when you're trying to source or verify something specific, with supporting images if useful.",
        ],
      },
      {
        key: "rxchat",
        heading: "RxChat",
        icon: "chat-outline",
        color: "#0891b2",
        body: [
          "Message other users and facilities directly — useful for following up on an RFQ response, a donation claim, or a job application without leaving the conversation to email.",
        ],
      },
    ],
  },
  {
    label: "Tools & Reference",
    sections: [
      {
        key: "formulary",
        heading: "Formulary",
        icon: "clipboard-plus-outline",
        color: "#d97706",
        body: [
          "Formulary is a reference tool for looking up medication information. If something you need isn't listed, you can submit a formulary request to have it added.",
        ],
      },
      {
        key: "rxvitals",
        heading: "RxVitals",
        icon: "heart-pulse",
        color: "#dc2626",
        body: [
          "RxVitals lets you log and track vital signs and health metrics over time — useful for personal tracking or, in a clinical context, monitoring a patient over multiple readings.",
        ],
      },
    ],
  },
  {
    label: "Account & Support",
    sections: [
      {
        key: "rxhelp",
        heading: "RxHelp",
        icon: "lifebuoy",
        color: "#0891b2",
        body: [
          "RxHelp is home to this guide, the FAQ, and two ways to get direct help: Consult, a formal request queue for advice from an experienced pharmacist on business or career topics, and Ask Your Pharmacist, for general medication questions. Urgent or emergency-flagged questions route to immediate guidance rather than waiting in the queue.",
          "Use Report a bug or a user from RxHelp for anything that isn't working right, or content/behavior that needs attention.",
        ],
      },
      {
        key: "ownership-transfer",
        heading: "Ownership Transfer",
        icon: "account-convert-outline",
        color: "#9333ea",
        body: [
          "If you're a verified professional and a facility or organization on the platform isn't yet claimed by you, open its profile and tap Request Ownership. Attach documentation supporting your claim — an admin reviews it, and approval transfers ownership, including replacing the previous owner where one exists.",
        ],
      },
      {
        key: "account-standing",
        heading: "Account Standing",
        icon: "shield-account-outline",
        color: "#64748b",
        body: [
          "If your account is suspended or banned, you'll see the reason (and, for a suspension, when it's lifted) the next time you open the app. If you believe this was a mistake, reach out through Report a Bug.",
          "Content that's removed by an admin — an RFQ, MediScope request, job, or donation — still shows on its own details page along with the reason, even though it no longer appears in feeds or marketplace browsing.",
        ],
      },
    ],
  },
];

const ALL_SECTIONS: Section[] = [GETTING_STARTED, ...GROUPS.flatMap((g) => g.sections)];

function matches(section: Section, query: string): boolean {
  const q = query.toLowerCase();
  return section.heading.toLowerCase().includes(q) || section.body.some((p) => p.toLowerCase().includes(q));
}

interface AccordionRowProps {
  section: Section;
  expanded: boolean;
  onToggle: () => void;
}

const AccordionRow: React.FC<AccordionRowProps> = ({ section, expanded, onToggle }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      className="rounded-2xl border p-3.5 gap-2.5"
      style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: section.color + "18" }}
        >
          <MaterialCommunityIcons name={section.icon} size={18} color={section.color} />
        </View>
        <Text className="text-sm font-bold flex-1" style={{ color: colors.text }}>
          {section.heading}
        </Text>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </View>
      {expanded &&
        section.body.map((paragraph, i) => (
          <Text key={i} className="text-[13px] leading-[20px] ml-12" style={{ color: colors.textSecondary }}>
            {paragraph}
          </Text>
        ))}
    </Pressable>
  );
};

export default function UserGuideScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(["getting-started"]));

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const query = search.trim();
  // While searching, a section is shown only if it matches, and it's
  // shown expanded regardless of expandedKeys — no point making someone
  // tap into a result they specifically searched for. Clearing the
  // search falls back to whatever they'd manually expanded before.
  const isSearching = query.length > 0;
  const visibleGettingStarted = !isSearching || matches(GETTING_STARTED, query);
  const visibleGroups = useMemo(() => {
    if (!isSearching) return GROUPS;
    return GROUPS.map((g) => ({ ...g, sections: g.sections.filter((s) => matches(s, query)) })).filter(
      (g) => g.sections.length > 0,
    );
  }, [isSearching, query]);
  const hasAnyResults = visibleGettingStarted || visibleGroups.length > 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="How RxPharmily Works" subtitle="A guide to every feature" />
      <View className="px-5 pt-4 pb-2">
        <Input
          placeholder="Search the guide..."
          value={search}
          onChangeText={setSearch}
          variant="flat"
          size="medium"
          returnKeyType="search"
          borderRadius={10}
          leftIcon={<MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />}
        />
      </View>
      {!hasAnyResults ? (
        <EmptyState icon="magnify-close" message={`No results for "${query}".`} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 24 }} showsVerticalScrollIndicator={false}>
          {visibleGettingStarted && (
            <AccordionRow
              section={GETTING_STARTED}
              expanded={isSearching || expandedKeys.has(GETTING_STARTED.key)}
              onToggle={() => toggle(GETTING_STARTED.key)}
            />
          )}

          {visibleGroups.map((group) => (
            <View key={group.label} className="gap-2.5">
              <Text
                className="text-[11px] font-bold uppercase tracking-widest ml-1"
                style={{ color: colors.textSecondary }}
              >
                {group.label}
              </Text>
              <View className="gap-2.5">
                {group.sections.map((section) => (
                  <AccordionRow
                    key={section.key}
                    section={section}
                    expanded={isSearching || expandedKeys.has(section.key)}
                    onToggle={() => toggle(section.key)}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
