import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";

interface Section {
  heading: string;
  body: string[];
}

// Placeholder identity fields — a real proprietary EULA needs the
// operating company's actual legal name, jurisdiction, and contact
// address filled in before this is a binding document. Left as clearly
// marked placeholders rather than invented values.
const COMPANY_NAME = "[Company Legal Name]";
const JURISDICTION = "[Governing Jurisdiction, e.g. Republic of Ghana]";
const CONTACT_EMAIL = "[legal@rxpharmily.com]";
const EFFECTIVE_DATE = "[Effective Date]";

const SECTIONS: Section[] = [
  {
    heading: "1. Agreement to Terms",
    body: [
      `This End User License Agreement ("Agreement") is a binding agreement between you ("User", "you") and ${COMPANY_NAME} ("we", "us", "our"), the operator of RxPharmily (the "App"). By creating an account, accessing, or using the App, you agree to be bound by this Agreement. If you do not agree, do not use the App.`,
      "RxPharmily is a marketplace and networking platform for licensed pharmacists, pharmacies, hospitals, and related organizations. It is not itself a pharmacy, a medical provider, or a party to any transaction, donation, or professional relationship formed between Users through the App.",
    ],
  },
  {
    heading: "2. License Grant",
    body: [
      `Subject to your compliance with this Agreement, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the App for its intended purpose. This license does not include any right to: resell or commercially exploit the App itself; copy, modify, reverse-engineer, or create derivative works of the App's software, design, or content; remove or alter any proprietary notices; or use automated means (scraping, bots) to access the App without our prior written consent.`,
      "All rights not expressly granted to you are reserved by us.",
    ],
  },
  {
    heading: "3. Proprietary Rights",
    body: [
      `The App, including its software, design, trademarks (including "RxPharmily" and associated logos), and all content we provide (excluding User Content, defined below), is the proprietary property of ${COMPANY_NAME} and its licensors, protected by intellectual property laws. Nothing in this Agreement transfers ownership of any such property to you.`,
    ],
  },
  {
    heading: "4. Eligibility and Account Registration",
    body: [
      "The App is intended for licensed pharmacy professionals, pharmacies, hospitals, and related organizations. You represent that any professional credentials, licenses, or organizational affiliations you provide are accurate and that you are legally permitted to hold the role you register under.",
      "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use.",
      "Certain profile fields become locked to direct editing once verified, and changes to them go through an admin-reviewed request instead — this protects the integrity of verified information relied on by other Users.",
    ],
  },
  {
    heading: "5. User Content and Conduct",
    body: [
      'You retain ownership of content you submit through the App — posts, RxRFQs, MediScope requests, donation listings, job postings, messages, and similar ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to host, display, and distribute it within the App for the purpose of operating the service.',
      "You are solely responsible for your User Content and represent that you have the right to submit it, and that it does not violate any law or third party's rights.",
      "You agree not to: post false, misleading, or fraudulent listings or credentials; harass, defraud, or abuse other Users; upload malicious code; attempt to circumvent the App's security, verification, or moderation mechanisms; or use the App for any purpose that violates applicable pharmaceutical, healthcare, or trade regulations in your jurisdiction.",
    ],
  },
  {
    heading: "6. Moderation, Suspension, and Termination",
    body: [
      "We reserve the right, at our sole discretion, to review, remove, or restrict access to any User Content, listing, or account that we believe violates this Agreement, applicable law, or poses a risk to other Users — with or without prior notice. Where practical, a removed listing or restricted account will show the reason for that action to the affected User.",
      "We may suspend or terminate your account for violations of this Agreement, fraudulent or unsafe conduct, or at our discretion for the protection of the platform and its Users. You may stop using the App and request account closure at any time by contacting us.",
    ],
  },
  {
    heading: "7. Marketplace, Donation, and Professional Interactions",
    body: [
      "The App facilitates connections between Users — quotations, donations, job postings, consultations — but is not a party to any resulting transaction, agreement, or professional relationship. We do not guarantee the accuracy of any listing, the fitness or licensure of any User, or the successful completion of any exchange.",
      "You are solely responsible for verifying the counterparties you deal with through the App and for complying with all applicable procurement, donation, employment, and healthcare regulations governing your transactions.",
      'Nothing in the App constitutes medical advice. Content under features such as "Ask Your Pharmacist" or "Consult" reflects the views of the individual professional responding and does not replace independent clinical judgment or a direct provider relationship.',
    ],
  },
  {
    heading: "8. Privacy",
    body: [
      "Our collection and use of your personal information is described in our separate Privacy Policy. By using the App, you consent to that collection and use as described there.",
    ],
  },
  {
    heading: "9. Disclaimers",
    body: [
      'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY LISTING, USER, OR CONTENT ON THE APP IS ACCURATE OR RELIABLE.',
    ],
  },
  {
    heading: "10. Limitation of Liability",
    body: [
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${COMPANY_NAME} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS ARISING FROM YOUR USE OF OR INABILITY TO USE THE APP, OR FROM ANY TRANSACTION OR INTERACTION WITH ANOTHER USER, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THIS AGREEMENT SHALL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR [NOMINAL AMOUNT].`,
    ],
  },
  {
    heading: "11. Indemnification",
    body: [
      `You agree to indemnify and hold harmless ${COMPANY_NAME}, its officers, employees, and agents from any claims, damages, or expenses (including reasonable legal fees) arising from your use of the App, your User Content, or your violation of this Agreement or any third party's rights.`,
    ],
  },
  {
    heading: "12. Changes to This Agreement",
    body: [
      "We may update this Agreement from time to time. Material changes will be notified through the App. Continued use of the App after a change takes effect constitutes acceptance of the revised Agreement.",
    ],
  },
  {
    heading: "13. Governing Law",
    body: [
      `This Agreement is governed by the laws of ${JURISDICTION}, without regard to conflict of law principles. Any dispute arising from this Agreement shall be subject to the exclusive jurisdiction of the courts of that jurisdiction.`,
    ],
  },
  {
    heading: "14. Contact",
    body: [
      `Questions about this Agreement can be sent to ${CONTACT_EMAIL}, or through Report a Bug within the App.`,
    ],
  },
];

export default function EulaScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Terms of Use" subtitle="End User License Agreement" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        <View>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Effective date: {EFFECTIVE_DATE}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            This is a proprietary agreement between you and {COMPANY_NAME}. Bracketed fields are placeholders to be completed before publishing.
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
