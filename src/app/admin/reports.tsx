import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import { ReportStatus, ReportTicket, ReportType } from "@/features/help/types/help.types";
import { toast } from "@/shared/hooks/use-toast";
import ListSkeleton from "@/shared/components/list-skeleton";

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
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (filter === "all") return sorted;
    if (filter === "open") return sorted.filter((r) => r.status === "submitted" || r.status === "in_review");
    return sorted.filter((r) => r.status === filter);
  }, [reports, filter]);

  const handleUpdateStatus = async (id: string, status: ReportStatus) => {
    const ok = await updateReportStatus(id, status);
    toast[ok ? "success" : "error"](ok ? "Report updated." : "Couldn't update the report.");
  };

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Reports</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {reports.length} total
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[styles.filterChip, { backgroundColor: active ? colors.primary : colors.backgroundElement }]}
            >
              <Text style={[styles.filterChipText, { color: active ? "#fff" : colors.textSecondary }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoadingReports && filtered.length === 0 ? (
        <ListSkeleton variant="card" rows={4} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="flag-outline" size={36} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Nothing here.</Text>
            </View>
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
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <View style={styles.cardTopRow}>
        <View style={[styles.typeIconWrap, { backgroundColor: colors.primary + "18" }]}>
          <MaterialCommunityIcons name={typeMeta.icon} size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {report.subject}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
            {typeMeta.label} · {format(report.createdAt)}
            {report.reportedUser ? ` · re: ${report.reportedUser}` : ""}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{report.description}</Text>

      {isOpen && (
        <View style={styles.actionsRow}>
          {report.status === "submitted" && (
            <Pressable
              onPress={() => onUpdateStatus(report.id, "in_review")}
              style={[styles.actionButton, { backgroundColor: colors.info + "18" }]}
            >
              <Text style={[styles.actionButtonText, { color: colors.info }]}>Start Review</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onUpdateStatus(report.id, "resolved")}
            style={[styles.actionButton, { backgroundColor: colors.success + "18" }]}
          >
            <MaterialCommunityIcons name="check" size={13} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>Resolve</Text>
          </Pressable>
          <Pressable
            onPress={() => onUpdateStatus(report.id, "dismissed")}
            style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}
          >
            <MaterialCommunityIcons name="close" size={13} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Dismiss</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  typeIconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  cardMeta: { fontSize: 11, marginTop: 3 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  cardDescription: { fontSize: 12, lineHeight: 18 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: { fontSize: 12, fontWeight: "700" },
});
