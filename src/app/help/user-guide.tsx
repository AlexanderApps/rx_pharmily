import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";

interface Section {
  heading: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    heading: "Getting Started",
    body: [
      "Create an account and choose your role — an individual professional, a facility (pharmacy or hospital), or an organization. Facilities and organizations can go through KYC verification, which unlocks a verified badge and access to features that require trust, like posting RFQs others can respond to.",
      "Verify your phone number from your profile to add an extra layer of trust. Once verified, it also needs a brief admin approval step before showing as fully verified.",
      "Once a facility or organization profile is verified, its key details (name, location, license info) can no longer be edited directly — instead, use Request Profile Update from the profile screen, and an admin reviews the change.",
    ],
  },
  {
    heading: "Home Feed & Community",
    body: [
      "The home feed shows a mix of posts, RxRFQs, MediScope requests, donations, jobs, and ads from your network, ranked by recency and relevance to your region.",
      "Tap Share something with the community to write a post. Community (RxChat's neighbor, under Posts) is where the broader conversation — likes, comments, polls — happens outside of any specific marketplace listing.",
    ],
  },
  {
    heading: "RxRFQs (Requests for Quotation)",
    body: [
      "Post an RxRFQ when you need a quote on medications or supplies — tap + on the RxRFQs screen, list what you need, set a submission deadline, and publish. You can restrict who sees it by region, facility type, or specific facilities using the visibility settings.",
      "Vendors respond with a quote (price, quantities, any additional costs like delivery or handling). Review responses from your RFQ's details page and award the one you choose.",
      "My RxRFQs shows everything you've posted, filterable by Published, Draft, and Closed.",
    ],
  },
  {
    heading: "MediScope",
    body: [
      "MediScope requests are for locating a specific medication or item — post one describing what you're looking for, and other facilities respond with availability, cost, and where to get it.",
      "Mark a response as fulfilled once you've sourced what you needed, which closes out the request.",
    ],
  },
  {
    heading: "Donations",
    body: [
      "Post a donation to give away medications or supplies your facility no longer needs — list each item with quantity and expiry date.",
      "To receive a donation, open the listing and tap Claim Items, choosing what you need and how much. The donor reviews and approves or rejects claims from their donation's details page.",
    ],
  },
  {
    heading: "RxJobs",
    body: [
      "Browse open positions or post one from RxJobs. A job posting can be attached to your facility or organization, or listed under a custom company name.",
      "Apply to a listing with a cover note; track your applications, or — if you posted the job — review applicants, from My Jobs.",
    ],
  },
  {
    heading: "RxAds",
    body: [
      "RxAds lets you promote a product or service to the network. Submit an ad with your content and payment; it goes live once an admin reviews and approves it, usually within a business day.",
    ],
  },
  {
    heading: "RxLink",
    body: [
      "RxLink connects you with prescriptions and medication search requests — submit a request when you're trying to source or verify something specific, with supporting images if useful.",
    ],
  },
  {
    heading: "RxChat",
    body: [
      "Message other users and facilities directly — useful for following up on an RFQ response, a donation claim, or a job application without leaving the conversation to email.",
    ],
  },
  {
    heading: "Formulary",
    body: [
      "Formulary is a reference tool for looking up medication information. If something you need isn't listed, you can submit a formulary request to have it added.",
    ],
  },
  {
    heading: "RxVitals",
    body: [
      "RxVitals lets you log and track vital signs and health metrics over time — useful for personal tracking or, in a clinical context, monitoring a patient over multiple readings.",
    ],
  },
  {
    heading: "RxHelp",
    body: [
      "RxHelp is home to this guide, the FAQ, and two ways to get direct help: Consult, a formal request queue for advice from an experienced pharmacist on business or career topics, and Ask Your Pharmacist, for general medication questions. Urgent or emergency-flagged questions route to immediate guidance rather than waiting in the queue.",
      "Use Report a bug or a user from RxHelp for anything that isn't working right, or content/behavior that needs attention.",
    ],
  },
  {
    heading: "Ownership Transfer",
    body: [
      "If you're a verified professional and a facility or organization on the platform isn't yet claimed by you, open its profile and tap Request Ownership. Attach documentation supporting your claim — an admin reviews it, and approval transfers ownership, including replacing the previous owner where one exists.",
    ],
  },
  {
    heading: "Account Standing",
    body: [
      "If your account is suspended or banned, you'll see the reason (and, for a suspension, when it's lifted) the next time you open the app. If you believe this was a mistake, reach out through Report a Bug.",
      "Content that's removed by an admin — an RFQ, MediScope request, job, or donation — still shows on its own details page along with the reason, even though it no longer appears in feeds or marketplace browsing.",
    ],
  },
];

export default function UserGuideScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="How RxPharmily Works" subtitle="A guide to every feature" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.heading} className="gap-2">
            <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
              {section.heading}
            </Text>
            {section.body.map((paragraph, i) => (
              <Text key={i} className="text-[13px] leading-[20px]" style={{ color: colors.textSecondary }}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
