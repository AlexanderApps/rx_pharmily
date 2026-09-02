import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import { ReportStatus, ReportTicket, ReportType } from "@/features/help/types/help.types";
import { toast } from "@/shared/hooks/use-toast";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import ListSkeleton from "@/shared/components/list-skeleton";
import ScreenHeader from "@/shared/components/screen-header";

const TYPE_META: Record<ReportType, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  bug: { label: "Bug", icon: "bug-outline" },
  user: { label: "User", icon: "account-alert-outline" },
  content: { label: "Content", icon: "flag-outline" },
  other: { label: "Other", icon: "dots-horizontal" },
};

const STATUS_META: Record<ReportStatus, { label: string; tone: "warning" | "info" | "success" | "error" }> = {
  submitted: { label: "New", tone: "warning" },
  in_review: { label: "In Review", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
  dismissed: { label: "Dismissed", tone: "error" },
};

const FILTERS: { label: string; value: ReportStatus | "open" | "all" }[] = [
  { label: "Open", value: "open" },
  { label: "New", value: "submitted" },
  { label: "In Review", value: "in_review" },
  { label: "Resolved", value: "resolved" },
  { label: "Dismissed", value: "dismissed" },
  { label: "All", value: "all" },
];

export default function AdminReportsScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const reports = useHelpStore((state) => state.reports);
  const isLoadingReports = useHelpStore((state) => state.isLoadingReports);
  const fetchReports = useHelpStore((state) => state.fetchReports);
  const updateReportStatus = useHelpStore((state) => state.updateReportStatus);
  const [filter, setFilter] = useState<ReportStatus | "open" | "all">("open");

  useEffect(() => {
    fetchReports();
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...reports].sort(
      (b, a) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (filter === "all") return sorted;
    if (filter === "open") return sorted.filter((r) => r.status === "submitted" || r.status === "in_review");
    return sorted.filter((r) => r.status === filter);
  }, [reports, filter]);

  const countFor = (value: ReportStatus | "open" | "all") => {
    if (value === "all") return reports.length;
    if (value === "open") return reports.filter((r) => r.status === "submitted" || r.status === "in_review").length;
    return reports.filter((r) => r.status === value).length;
  };

  const handleUpdateStatus = async (id: string, status: ReportStatus) => {
    const ok = await updateReportStatus(id, status);
    toast[ok ? "success" : "error"](ok ? "Report updated." : "Couldn't update the report.");
  };

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header element */}
      <ScreenHeader title="Reports" subtitle={`${reports.length} total`} />

      {/* Tabs list navigation */}
      <StatusFilterTabs
        options={FILTERS.map((f) => ({ key: f.value, label: f.label, count: countFor(f.value) }))}
        selected={filter}
        onSelect={(key) => setFilter(key as ReportStatus | "open" | "all")}
      />

      {isLoadingReports && filtered.length === 0 ? (
        <ListSkeleton variant="card" rows={4} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EmptyState icon="flag-outline" message="Nothing here." />
          }
          renderItem={({ item }) => <ReportCard report={item} onUpdateStatus={handleUpdateStatus} />}
        />
      )}
    </SafeAreaView>
  );
}

function ReportCard({
  report,
  onUpdateStatus,
}: {
  report: ReportTicket;
  onUpdateStatus: (id: string, status: ReportStatus) => void | Promise<void>;
}) {
  const { colors } = useTheme();
  const typeMeta = TYPE_META[report.type];
  const statusMeta = STATUS_META[report.status];
  const statusColor = colors[statusMeta.tone];
  const isOpen = report.status === "submitted" || report.status === "in_review";

  return (
    <View className="rounded-[14px] border p-[14px] gap-2.5" style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}>
      <View className="flex-row items-start gap-2.5">
        <View className="w-8 h-8 rounded-[9px] items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
          <MaterialCommunityIcons name={typeMeta.icon} size={16} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold leading-[19px]" style={{ color: colors.text }} numberOfLines={2}>
            {report.subject}
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
            {typeMeta.label} · {format(report.createdAt)} {report.reportedUser ? ` · re: ${report.reportedUser}` : ""}
          </Text>
        </View>
        <View className="px-2 py-1 rounded-text rounded-lg" style={{ backgroundColor: statusColor + "18" }}>
          <Text className="text-[10px] font-bold" style={{ color: statusColor }}>{statusMeta.label}</Text>
        </View>
      </View>

      <Text className="text-xs leading-[18px]" style={{ color: colors.textSecondary }}>{report.description}</Text>

      {isOpen && (
        <View className="flex-row flex-wrap gap-2">
          {report.status === "submitted" && (
            <Pressable
              onPress={() => onUpdateStatus(report.id, "in_review")}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
              style={{ backgroundColor: colors.info + "18" }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.info }}>Start Review</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onUpdateStatus(report.id, "resolved")}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: colors.success + "18" }}
          >
            <MaterialCommunityIcons name="check" size={13} color={colors.success} />
            <Text className="text-xs font-bold" style={{ color: colors.success }}>Resolve</Text>
          </Pressable>
          <Pressable
            onPress={() => onUpdateStatus(report.id, "dismissed")}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: colors.error + "18" }}
          >
            <MaterialCommunityIcons name="close" size={13} color={colors.error} />
            <Text className="text-xs font-bold" style={{ color: colors.error }}>Dismiss</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
