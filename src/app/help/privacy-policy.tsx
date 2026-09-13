import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";

interface Section {
  heading: string;
  body: string[];
}

// Same placeholder pattern as eula.tsx — a real privacy policy needs
// the operating company's actual legal name, jurisdiction, and contact
// address before this is a complete, publishable document.
const COMPANY_NAME = "[Company Legal Name]";
const JURISDICTION = "[Governing Jurisdiction, e.g. Republic of Ghana]";
const CONTACT_EMAIL = "[privacy@rxpharmily.com]";
const EFFECTIVE_DATE = "[Effective Date]";

const SECTIONS: Section[] = [
  {
    heading: "1. Overview",
    body: [
      `This Privacy Policy explains how ${COMPANY_NAME} ("we", "us", "our") collects, uses, and shares information in connection with RxPharmily (the "App"). It should be read alongside our Terms of Use (EULA).`,
      "This policy is built around one core principle: your private, non-public account information is not shared with other Users or third parties. What is shared is the same professional and facility information that's already public within the App as part of its normal function — for example, a facility's name and location appearing on a listing you posted, or being given to someone whose product search you fulfilled through RxLink. Sections 3 and 4 below explain exactly where that line sits.",
    ],
  },
  {
    heading: "2. Information We Collect",
    body: [
      "Account information: your name, email, phone number, professional role or title, and the facility or organization you're affiliated with.",
      "Verification information: KYC documents and license details submitted for facility or organization verification, and phone verification codes.",
      "Content you provide: posts, comments, RxRFQs, MediScope requests, donation listings, job postings, messages, RxLink requests, and any other content you submit through the App.",
      "Usage and device information: how you interact with the App, general region for visibility and matching features (e.g. showing you RFQs relevant to your area), device type, and similar technical data.",
    ],
  },
  {
    heading: "3. How We Use Information",
    body: [
      "To operate the App: creating and managing your account, verifying facilities and organizations, matching RxRFQs, MediScope requests, donations, and jobs to relevant Users, and facilitating RxLink searches.",
      "To communicate with you: notifications, responses to support requests, and updates about your account or activity.",
      "To maintain safety and trust: content and account moderation, fraud prevention, and investigating reports.",
      "For data analysis: we analyze aggregated request and usage data — for example, patterns in what's being requested, donated, or searched for — to understand how the platform is used and to inform product and policy decisions. This analysis works with de-identified or aggregated data; it is not used to extract or share any individual's private information (see Section 4).",
    ],
  },
  {
    heading: "4. What We Share — and What We Don't",
    body: [
      "We do not share your private, non-public account information — things like your raw contact details, KYC documents, private messages, or account activity — with other Users or any third party, except where you've taken an action that inherently shares it (for example, sending a chat message to another User) or where required by law.",
      'Public professional and facility information is different: it is shown to other Users as the normal, intended function of the App, the same way it would be if you listed it on any professional directory or marketplace. This includes a facility or organization\'s name, location, verified status, and the content of listings you\'ve chosen to publish (an RxRFQ, a donation, a job posting, and so on).',
      'RxLink is a concrete example of this: when you submit an RxLink request for a medication or product, an admin may check which facilities have it available and inform you of that facility\'s name and location so you can follow up. That facility isn\'t having private information disclosed about it — its name and location are the same public information it already put on the platform, being used for the application\'s normal purpose of connecting supply and demand. No facility\'s private account details, financials, or non-public records are shared in this process.',
      "We may share information with service providers who help us operate the App (such as hosting and phone verification providers), bound by confidentiality obligations, and where required to comply with law, regulation, or legal process.",
    ],
  },
  {
    heading: "5. Data Retention",
    body: [
      "We retain your information for as long as your account is active and as needed to provide the App's features, comply with legal obligations, resolve disputes, and enforce our agreements. Content moderation and account moderation records are retained as an audit trail of admin actions.",
    ],
  },
  {
    heading: "6. Your Choices and Rights",
    body: [
      "You can review and, for most fields, edit your profile information directly. Once a facility or organization profile is verified, changes to its key details go through a reviewed update request instead, to protect the integrity of information other Users rely on.",
      "You can control what an RxRFQ or MediScope request's visibility is scoped to (region, facility type, or specific facilities) when you create it.",
      `To request access to, correction of, or deletion of your personal information beyond what's available directly in the App, contact us at ${CONTACT_EMAIL} or through Report a Bug.`,
    ],
  },
  {
    heading: "7. Data Security",
    body: [
      "We use reasonable technical and organizational measures to protect your information, including access controls and encryption in transit. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "8. Children's Privacy",
    body: [
      "The App is intended for licensed pharmacy professionals and organizations, and is not directed at children. We do not knowingly collect personal information from anyone under the age of 18.",
    ],
  },
  {
    heading: "9. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. Material changes will be notified through the App. Continued use of the App after a change takes effect constitutes acceptance of the revised policy.",
    ],
  },
  {
    heading: "10. Governing Law",
    body: [
      `This policy is governed by the laws of ${JURISDICTION}, consistent with the governing law provision in our Terms of Use.`,
    ],
  },
  {
    heading: "11. Contact",
    body: [
      `Questions about this policy, or requests regarding your personal information, can be sent to ${CONTACT_EMAIL}, or through Report a Bug within the App.`,
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Privacy Policy" subtitle="How we collect, use, and share information" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        <View>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Effective date: {EFFECTIVE_DATE}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            This policy is issued by {COMPANY_NAME}. Bracketed fields are placeholders to be completed before publishing.
          </Text>
        </View>
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
