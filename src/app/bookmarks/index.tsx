import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import { toast } from "@/shared/hooks/use-toast";
import { useBookmarksStore } from "@/features/bookmarks/hooks/use-bookmarks-data";
import { BookmarkContentType } from "@/features/bookmarks/types/bookmarks.types";
import { navigateToEntity } from "@/features/chat/components/linked-entity-card";

const LINKED_ENTITY_TYPE: Record<BookmarkContentType, "rfq" | "mediscope" | "donation" | "job"> = {
  rxrfq: "rfq",
  mediscope: "mediscope",
  donation: "donation",
  job: "job",
};

const TYPE_META: Record<BookmarkContentType, { label: string; icon: string }> = {
  rxrfq: { label: "RFQ", icon: "file-document-outline" },
  mediscope: { label: "MediScope", icon: "heart-search" },
  donation: { label: "Donation", icon: "heart-outline" },
  job: { label: "Job", icon: "briefcase-outline" },
};

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<BookmarkContentType | "all">("all");

  const bookmarks = useBookmarksStore((state) => state.bookmarks);
  const isLoading = useBookmarksStore((state) => state.isLoading);
  const fetchBookmarks = useBookmarksStore((state) => state.fetchBookmarks);
  const toggleBookmark = useBookmarksStore((state) => state.toggleBookmark);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? bookmarks : bookmarks.filter((b) => b.contentType === filter)),
    [bookmarks, filter],
  );

  const handleRemove = async (contentType: BookmarkContentType, contentId: string, title: string) => {
    const ok = await toggleBookmark(contentType, contentId, { title });
    if (!ok) toast.error("Couldn't remove that bookmark.");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="My Bookmarks" subtitle="RxRFQs, MediScope, Donations, and Jobs you've saved" />

      <StatusFilterTabs
        options={[
          { key: "all", label: "All" },
          { key: "rxrfq", label: "RFQs" },
          { key: "mediscope", label: "MediScope" },
          { key: "donation", label: "Donations" },
          { key: "job", label: "Jobs" },
        ]}
        selected={filter}
        onSelect={(key) => setFilter(key as BookmarkContentType | "all")}
      />

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshing={isLoading}
        onRefresh={fetchBookmarks}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            message={filter === "all" ? "No bookmarks yet." : `No ${TYPE_META[filter as BookmarkContentType].label} bookmarks yet.`}
          />
        }
        renderItem={({ item }) => {
          const meta = TYPE_META[item.contentType];
          return (
            <Pressable
              onPress={() => navigateToEntity({ type: LINKED_ENTITY_TYPE[item.contentType], id: item.contentId, code: item.code ?? "", title: item.title, subtitle: item.subtitle, status: item.status ?? "" })}
              className="flex-row items-center gap-3 rounded-2xl border p-3.5"
              style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
            >
              <View
                className="w-11 h-11 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.primary + "18" }}
              >
                <MaterialCommunityIcons name={meta.icon as any} size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[10px] font-bold uppercase" style={{ color: colors.primary }}>
                    {meta.label}
                  </Text>
                  {item.code && (
                    <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                      {item.code}
                    </Text>
                  )}
                </View>
                <Text className="text-sm font-bold mt-0.5" style={{ color: colors.text }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
                <Text className="text-[11px] mt-1" style={{ color: colors.textSecondary }}>
                  Saved {format(item.createdAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemove(item.contentType, item.contentId, item.title)}
                hitSlop={8}
                className="p-1.5"
              >
                <MaterialCommunityIcons name="bookmark" size={20} color={colors.primary} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
