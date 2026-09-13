import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, Modal, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useContentModerationStore } from "@/features/content-moderation/hooks/use-content-moderation-data";
import { ContentModerationType, ModerationSearchResult } from "@/features/content-moderation/types/content-moderation.types";

type Feature = "rxrfq" | "mediscope" | "job" | "donation";
type Kind = "request" | "response";

const CONTENT_TYPE_MAP: Record<Feature, Record<Kind, ContentModerationType>> = {
  rxrfq: { request: "rxrfq", response: "rxrfq_response" },
  mediscope: { request: "mediscope_request", response: "mediscope_response" },
  job: { request: "job", response: "job_application" },
  donation: { request: "donation", response: "donation_response" },
};

const FEATURE_LABEL: Record<Feature, string> = { rxrfq: "RxRFQ", mediscope: "MediScope", job: "Jobs", donation: "Donations" };
const KIND_LABEL: Record<Feature, Record<Kind, string>> = {
  rxrfq: { request: "RFQs", response: "Responses" },
  mediscope: { request: "Requests", response: "Responses" },
  job: { request: "Jobs", response: "Applications" },
  donation: { request: "Donations", response: "Claims" },
};
const HAS_CODE: Record<ContentModerationType, boolean> = {
  rxrfq: true,
  rxrfq_response: false,
  mediscope_request: true,
  mediscope_response: false,
  job: false,
  job_application: false,
  donation: true,
  donation_response: false,
};

export default function AdminContentModerationScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const [feature, setFeature] = useState<Feature>("rxrfq");
  const [kind, setKind] = useState<Kind>("request");
  const [query, setQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<ModerationSearchResult | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const searchResults = useContentModerationStore((state) => state.searchResults);
  const isSearching = useContentModerationStore((state) => state.isSearching);
  const searchContent = useContentModerationStore((state) => state.searchContent);
  const removeContent = useContentModerationStore((state) => state.removeContent);
  const restoreContent = useContentModerationStore((state) => state.restoreContent);

  const contentType = CONTENT_TYPE_MAP[feature][kind];

  if (!isAdmin) return <Redirect href="/(tabs)" />;

  const runSearch = (nextFeature: Feature, nextKind: Kind, nextQuery: string) => {
    const type = CONTENT_TYPE_MAP[nextFeature][nextKind];
    if (nextQuery.trim()) searchContent(type, nextQuery);
  };

  const handleRestore = async (item: ModerationSearchResult) => {
    const confirmed = await confirm({
      title: "Restore this item?",
      message: "It becomes visible again to everyone it was previously visible to.",
      confirmLabel: "Restore",
    });
    if (!confirmed) return;
    const ok = await restoreContent(item.contentType, item.id);
    if (ok) {
      toast.success("Restored.");
      searchContent(contentType, query);
    } else {
      toast.error("Couldn't restore this item.");
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    if (!reasonText.trim()) {
      toast.error("A reason is required.");
      return;
    }
    setSubmitting(true);
    const ok = await removeContent(removeTarget.contentType, removeTarget.id, reasonText.trim());
    setSubmitting(false);
    if (ok) {
      toast.success("Removed.");
      searchContent(contentType, query);
    } else {
      toast.error("Couldn't remove this item.");
    }
    setRemoveTarget(null);
    setReasonText("");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Content Moderation" subtitle="Search RxRFQ, MediScope, and Jobs by code or id, then remove with a reason" />

      <StatusFilterTabs
        options={[
          { key: "rxrfq", label: FEATURE_LABEL.rxrfq },
          { key: "mediscope", label: FEATURE_LABEL.mediscope },
          { key: "job", label: FEATURE_LABEL.job },
          { key: "donation", label: FEATURE_LABEL.donation },
        ]}
        selected={feature}
        onSelect={(key) => {
          const nextFeature = key as Feature;
          setFeature(nextFeature);
          runSearch(nextFeature, kind, query);
        }}
      />
      <StatusFilterTabs
        options={[
          { key: "request", label: KIND_LABEL[feature].request },
          { key: "response", label: KIND_LABEL[feature].response },
        ]}
        selected={kind}
        onSelect={(key) => {
          const nextKind = key as Kind;
          setKind(nextKind);
          runSearch(feature, nextKind, query);
        }}
      />

      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ backgroundColor: colors.backgroundElement }}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              runSearch(feature, kind, text);
            }}
            placeholder={HAS_CODE[contentType] ? "Search by code or id" : "Search by id"}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            className="flex-1 text-sm"
            style={{ color: colors.text }}
          />
          {isSearching && <ActivityIndicator size="small" color={colors.textSecondary} />}
        </View>
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 8 }}
        ListEmptyComponent={
          <EmptyState
            icon="magnify"
            message={query.trim() ? "No matches." : `Enter a ${HAS_CODE[contentType] ? "code or id" : "id"} to search.`}
          />
        }
        renderItem={({ item }) => (
          <View className="rounded-2xl border p-3.5 gap-2" style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                )}
                <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                  {format(item.createdAt)} · {item.id}
                </Text>
              </View>
              {item.isRemoved && (
                <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: colors.error + "18" }}>
                  <Text className="text-[10px] font-bold" style={{ color: colors.error }}>Removed</Text>
                </View>
              )}
            </View>

            {item.isRemoved && item.removedReason && (
              <Text className="text-xs" style={{ color: colors.error }}>
                Reason: {item.removedReason}
              </Text>
            )}

            {item.isRemoved ? (
              <Pressable
                onPress={() => handleRestore(item)}
                className="py-2.5 rounded-xl items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-sm font-semibold text-white">Restore</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setRemoveTarget(item)}
                className="py-2.5 rounded-xl items-center"
                style={{ backgroundColor: colors.error }}
              >
                <Text className="text-sm font-semibold text-white">Remove</Text>
              </Pressable>
            )}
          </View>
        )}
      />

      <Modal visible={!!removeTarget} transparent animationType="fade" onRequestClose={() => setRemoveTarget(null)}>
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className="w-full rounded-2xl p-5 gap-3" style={{ backgroundColor: colors.background }}>
            <Text className="text-base font-bold" style={{ color: colors.text }}>Remove this item?</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              It's hidden from everyone except admins until restored. This reason is shown to whoever created it.
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Reason for removal"
              placeholderTextColor={colors.textSecondary}
              multiline
              className="border rounded-lg px-3 py-2.5 text-sm min-h-[80px]"
              style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundElement }}
            />
            <View className="flex-row gap-2 mt-1">
              <Pressable
                onPress={() => {
                  setRemoveTarget(null);
                  setReasonText("");
                }}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRemove}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.error, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-sm font-semibold text-white">Remove</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
