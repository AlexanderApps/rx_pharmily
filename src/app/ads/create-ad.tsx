import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUserName = useProfileStore((state) => state.user.fullName);
  const { id } = useLocalSearchParams<{ id?: string }>();

  const ads = useAdsStore((state) => state.ads);
  const plans = useAdsStore((state) => state.plans);
  const submitAd = useAdsStore((state) => state.submitAd);
  const updateAd = useAdsStore((state) => state.updateAd);

  const existing = useMemo(
    () => (id ? ads.find((a) => a.id === id) : undefined),
    [id, ads],
  );

  const [title, setTitle] = useState(existing?.title ?? "");
  const [text, setText] = useState(existing?.text ?? "");
  const [category, setCategory] = useState<AdCategory>(existing?.category ?? "service");
  const [fdaApprovalId, setFdaApprovalId] = useState(existing?.fdaApprovalId ?? "");
  const [linkUrl, setLinkUrl] = useState(existing?.linkUrl ?? "");
  const [media, setMedia] = useState<AdMedia[]>(existing?.media ?? []);
  const [planId, setPlanId] = useState(
    existing?.plan.id ?? plans[1]?.id ?? plans[0]?.id,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresFda = FDA_ID_REQUIRED_CATEGORIES.includes(category);
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === planId),
    [plans, planId],
  );

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
    if (isSubmitting) return;

    if (existing) {
      setIsSubmitting(true);
      const success = await updateAd(existing.id, {
        title,
        text,
        media: media.length > 0 ? media : undefined,
        linkUrl: linkUrl.trim() || undefined,
        category,
        fdaApprovalId: requiresFda ? fdaApprovalId.trim() : undefined,
        planId: selectedPlan.id,
      });
      setIsSubmitting(false);
      if (!success) {
        toast.error("Couldn't save your changes. Please try again.");
        return;
      }
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

    setIsSubmitting(true);
    const newId = await submitAd({
      title,
      text,
      media: media.length > 0 ? media : undefined,
      linkUrl: linkUrl.trim() || undefined,
      category,
      fdaApprovalId: requiresFda ? fdaApprovalId.trim() : undefined,
      planId: selectedPlan.id,
    });
    setIsSubmitting(false);

    if (!newId) {
      toast.error("Couldn't submit your ad. Please try again.");
      return;
    }

    router.replace({ pathname: "/ads/ad-details", params: { id: newId } });
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        {/* Header */}
        <View
          className="flex-row items-center gap-2.5 px-4 py-3 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          )}
          <View className="flex-1">
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              {existing ? "Edit Ad" : "Create an Ad"}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              {existing
                ? "Resubmitting for review"
                : `Advertising as ${currentUserName}`}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerClassName="p-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text className="text-xs font-semibold" style={{ color: colors.text }}>
            Title <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What are you advertising?"
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
            }}
          />

          {/* Description */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Description <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Describe the product or service..."
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[90px]"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
              textAlignVertical: "top",
            }}
            multiline
          />

          {/* Category chips */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: active ? colors.primary : colors.backgroundElement,
                  }}
                >
                  <MaterialCommunityIcons
                    name={c.icon as any}
                    size={14}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: active ? "#fff" : colors.textSecondary }}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* FDA ID (conditional) */}
          {requiresFda && (
            <View className="mt-3.5">
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                FDA Approval ID <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={fdaApprovalId}
                onChangeText={setFdaApprovalId}
                placeholder="e.g. FDA-GH-2025-01234"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
              <View className="flex-row items-start gap-1.5 mt-1.5">
                <MaterialCommunityIcons
                  name="shield-alert-outline"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text
                  className="text-[11px] flex-1 leading-[15px]"
                  style={{ color: colors.textSecondary }}
                >
                  Medication and medical device ads require a valid FDA registration
                  number before they can be reviewed.
                </Text>
              </View>
            </View>
          )}

          {/* Link */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Link (optional)
          </Text>
          <TextInput
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="url"
            className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
            }}
          />

          {/* Media */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Media (optional)
          </Text>
          <AdMediaPicker media={media} onChange={setMedia} />

          {/* Plan selection */}
          <Text className="text-xs font-semibold mt-[18px]" style={{ color: colors.text }}>
            {existing ? "Plan" : "Choose a Plan"}
            {!existing && <Text style={{ color: colors.error }}> *</Text>}
          </Text>

          {existing ? (
            <View
              className="border-[1.5px] rounded-[14px] p-3.5 gap-1.5 mt-2 opacity-80"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  {existing.plan.name}
                </Text>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
              <Text
                className="text-xs leading-[17px]"
                style={{ color: colors.textSecondary }}
              >
                Already paid — plan changes aren't available while editing.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5 mt-2">
              {plans.map((plan) => {
                const active = planId === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setPlanId(plan.id)}
                    className="border-[1.5px] rounded-[14px] p-3.5 gap-1.5"
                    style={{
                      backgroundColor: colors.backgroundElement,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-bold" style={{ color: colors.text }}>
                          {plan.name}
                        </Text>
                        {plan.featured && (
                          <View
                            className="flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: colors.secondary + "20" }}
                          >
                            <MaterialCommunityIcons
                              name="star"
                              size={11}
                              color={colors.secondary}
                            />
                            <Text
                              className="text-[10px] font-bold"
                              style={{ color: colors.secondary }}
                            >
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
                    <Text
                      className="text-xs leading-[17px]"
                      style={{ color: colors.textSecondary }}
                    >
                      {plan.description}
                    </Text>
                    <Text className="text-base font-extrabold mt-0.5" style={{ color: colors.text }}>
                      {plan.currency} {formatAmount(plan.price)}{" "}
                      <Text
                        className="text-xs font-medium"
                        style={{ color: colors.textSecondary }}
                      >
                        / {plan.durationDays} days
                      </Text>
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Disclaimer */}
          <View className="flex-row items-start gap-1.5 mt-4">
            <MaterialCommunityIcons
              name="information-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text
              className="text-[11px] flex-1 leading-[15px]"
              style={{ color: colors.textSecondary }}
            >
              {existing
                ? "Saving changes sends this ad back to a system admin for review before it's live again."
                : "Payment is charged when you submit. Your ad goes live only after a system admin approves it — rejected ads are refunded."}
            </Text>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl mt-4"
            style={{
              backgroundColor: canSubmit ? colors.primary : colors.backgroundElement,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={canSubmit ? "#fff" : colors.textSecondary} />
            ) : (
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={17}
                color={canSubmit ? "#fff" : colors.textSecondary}
              />
            )}
            <Text
              className="text-[15px] font-bold"
              style={{ color: canSubmit ? "#fff" : colors.textSecondary }}
            >
              {isSubmitting
                ? existing
                  ? "Saving..."
                  : "Submitting..."
                : existing
                  ? "Save & Resubmit for Review"
                  : selectedPlan
                    ? `Pay ${selectedPlan.currency} ${formatAmount(selectedPlan.price)} & Submit`
                    : "Select a plan"}
            </Text>
          </Pressable>

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});