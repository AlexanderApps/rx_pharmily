import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import {
  AdCategory,
  AdMedia,
  FDA_ID_REQUIRED_CATEGORIES,
} from "@/features/ads/types/ads.types";
import AdMediaPicker from "@/features/ads/components/ad-media-picker";
import { formatAmount } from "@/shared/utils/format";

const CATEGORIES: { value: AdCategory; label: string; icon: string }[] = [
  { value: "medication", label: "Medication", icon: "pill" },
  { value: "medical-device", label: "Medical Device", icon: "stethoscope" },
  { value: "service", label: "Service", icon: "briefcase-outline" },
  { value: "equipment", label: "Equipment", icon: "toolbox-outline" },
  { value: "other", label: "Other", icon: "dots-horizontal" },
];

export default function CreateAdScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUserName = useProfileStore((state) => state.user.fullName);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ads = useAdsStore((state) => state.ads);
  const plans = useAdsStore((state) => state.plans);
  const submitAd = useAdsStore((state) => state.submitAd);
  const updateAd = useAdsStore((state) => state.updateAd);

  const existing = useMemo(() => (id ? ads.find((a) => a.id === id) : undefined), [id, ads]);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [text, setText] = useState(existing?.text ?? "");
  const [category, setCategory] = useState<AdCategory>(existing?.category ?? "service");
  const [fdaApprovalId, setFdaApprovalId] = useState(existing?.fdaApprovalId ?? "");
  const [linkUrl, setLinkUrl] = useState(existing?.linkUrl ?? "");
  const [media, setMedia] = useState<AdMedia[]>(existing?.media ?? []);
  const [planId, setPlanId] = useState(
    existing?.plan.id ?? plans[1]?.id ?? plans[0]?.id,
  );

  const requiresFda = FDA_ID_REQUIRED_CATEGORIES.includes(category);
  const selectedPlan = useMemo(() => plans.find((p) => p.id === planId), [plans, planId]);

  const canSubmit =
    title.trim().length > 0 &&
    text.trim().length > 0 &&
    !!selectedPlan &&
    (!requiresFda || fdaApprovalId.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || !selectedPlan) {
      Alert.alert(
        "Missing information",
        requiresFda && fdaApprovalId.trim().length === 0
          ? "This category requires a valid FDA approval identifier."
          : "Please fill in the title, description, and choose a plan.",
      );
      return;
    }

    if (existing) {
      await updateAd(existing.id, {
        title,
        text,
        media: media.length > 0 ? media : undefined,
        linkUrl: linkUrl.trim() || undefined,
        category,
        fdaApprovalId: requiresFda ? fdaApprovalId.trim() : undefined,
        planId: selectedPlan.id,
      });
      toast.success("Your changes were saved and sent back for admin review.");
      router.back();
      return;
    }

    const confirmed = await confirm({
      title: `Pay ${selectedPlan.currency} ${formatAmount(selectedPlan.price)}?`,
      message: `This confirms payment for the "${selectedPlan.name}" plan. Your ad will be submitted for admin review immediately after.`,
      confirmLabel: "Pay & Submit",
    });
    if (!confirmed) return;

    const newId = await submitAd({
      title,
      text,
      media: media.length > 0 ? media : undefined,
      linkUrl: linkUrl.trim() || undefined,
      category,
      fdaApprovalId: requiresFda ? fdaApprovalId.trim() : undefined,
      planId: selectedPlan.id,
    });
    if (!newId) {
      toast.error("Couldn't submit your ad. Please try again.");
      return;
    }
    router.replace({ pathname: "/ads/ad-details", params: { id: newId } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {existing ? "Edit Ad" : "Create an Ad"}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {existing ? "Resubmitting for review" : `Advertising as ${currentUserName}`}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.text }]}>
            Title <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What are you advertising?"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
            Description <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Describe the product or service..."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? colors.primary : colors.backgroundElement },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={c.icon as any}
                    size={14}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {requiresFda && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.label, { color: colors.text }]}>
                FDA Approval ID <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={fdaApprovalId}
                onChangeText={setFdaApprovalId}
                placeholder="e.g. FDA-GH-2025-01234"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
              />
              <View style={styles.fdaHintRow}>
                <MaterialCommunityIcons name="shield-alert-outline" size={13} color={colors.textSecondary} />
                <Text style={[styles.fdaHintText, { color: colors.textSecondary }]}>
                  Medication and medical device ads require a valid FDA registration number before they
                  can be reviewed.
                </Text>
              </View>
            </View>
          )}

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
            Link (optional)
          </Text>
          <TextInput
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="url"
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
            Media (optional)
          </Text>
          <AdMediaPicker media={media} onChange={setMedia} />

          <Text style={[styles.label, { color: colors.text, marginTop: 18 }]}>
            {existing ? "Plan" : "Choose a Plan"}
            {!existing && <Text style={{ color: colors.error }}> *</Text>}
          </Text>

          {existing ? (
            <View
              style={[
                styles.planCard,
                styles.planCardLocked,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border },
              ]}
            >
              <View style={styles.planHeaderRow}>
                <Text style={[styles.planName, { color: colors.text }]}>{existing.plan.name}</Text>
                <MaterialCommunityIcons name="lock-outline" size={16} color={colors.textSecondary} />
              </View>
              <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                Already paid — plan changes aren't available while editing.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              {plans.map((plan) => {
                const active = planId === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setPlanId(plan.id)}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.planHeaderRow}>
                      <View style={styles.planNameRow}>
                        <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                        {plan.featured && (
                          <View style={[styles.featuredTag, { backgroundColor: colors.secondary + "20" }]}>
                            <MaterialCommunityIcons name="star" size={11} color={colors.secondary} />
                            <Text style={[styles.featuredTagText, { color: colors.secondary }]}>
                              Featured
                            </Text>
                          </View>
                        )}
                      </View>
                      <MaterialCommunityIcons
                        name={active ? "radiobox-marked" : "radiobox-blank"}
                        size={20}
                        color={active ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                      {plan.description}
                    </Text>
                    <Text style={[styles.planPrice, { color: colors.text }]}>
                      {plan.currency} {formatAmount(plan.price)}{" "}
                      <Text style={[styles.planDuration, { color: colors.textSecondary }]}>
                        / {plan.durationDays} days
                      </Text>
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.disclaimerRow}>
            <MaterialCommunityIcons name="information-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
              {existing
                ? "Saving changes sends this ad back to a system admin for review before it's live again."
                : "Payment is charged when you submit. Your ad goes live only after a system admin approves it — rejected ads are refunded."}
            </Text>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.submitButton,
              { backgroundColor: canSubmit ? colors.primary : colors.backgroundElement },
            ]}
          >
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={17}
              color={canSubmit ? "#fff" : colors.textSecondary}
            />
            <Text
              style={[
                styles.submitButtonText,
                { color: canSubmit ? "#fff" : colors.textSecondary },
              ]}
            >
              {existing
                ? "Save & Resubmit for Review"
                : selectedPlan
                  ? `Pay ${selectedPlan.currency} ${formatAmount(selectedPlan.price)} & Submit`
                  : "Select a plan"}
            </Text>
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  content: { padding: 16 },
  label: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginTop: 6,
  },
  textArea: { minHeight: 90 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  fdaHintRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 6 },
  fdaHintText: { fontSize: 11, flex: 1, lineHeight: 15 },
  planCard: { borderWidth: 1.5, borderRadius: 14, padding: 14, gap: 6 },
  planCardLocked: { marginTop: 8, opacity: 0.8 },
  planHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  planName: { fontSize: 14, fontWeight: "700" },
  featuredTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featuredTagText: { fontSize: 10, fontWeight: "700" },
  planDescription: { fontSize: 12, lineHeight: 17 },
  planPrice: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  planDuration: { fontSize: 12, fontWeight: "500" },
  disclaimerRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 16 },
  disclaimerText: { fontSize: 11, flex: 1, lineHeight: 15 },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  submitButtonText: { fontSize: 15, fontWeight: "700" },
});
