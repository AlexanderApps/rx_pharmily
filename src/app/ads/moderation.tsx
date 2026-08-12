import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { Ad } from "@/features/ads/types/ads.types";
import AdStatusPill from "@/features/ads/components/ad-status-pill";
import { formatAmount } from "@/shared/utils/format";

type FilterTab = "pending" | "approved" | "all";
type ReasonAction = "reject" | "suspend" | "ban";

export default function AdModerationScreen() {
  const { colors } = useTheme();
  const ads = useAdsStore((state) => state.ads);
  const approveAd = useAdsStore((state) => state.approveAd);
  const rejectAd = useAdsStore((state) => state.rejectAd);
  const suspendAd = useAdsStore((state) => state.suspendAd);
  const reinstateAd = useAdsStore((state) => state.reinstateAd);
  const banAd = useAdsStore((state) => state.banAd);

  const [tab, setTab] = useState<FilterTab>("pending");
  const [reasonTarget, setReasonTarget] = useState<{ ad: Ad; action: ReasonAction } | null>(null);
  const [reasonText, setReasonText] = useState("");

  const filtered = useMemo(() => {
    const sorted = [...ads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (tab === "pending") return sorted.filter((a) => a.status === "pending");
    if (tab === "approved") return sorted.filter((a) => a.status === "approved");
    return sorted;
  }, [ads, tab]);

  const pendingCount = ads.filter((a) => a.status === "pending").length;

  const openReasonPrompt = (ad: Ad, action: ReasonAction) => {
    setReasonTarget({ ad, action });
    setReasonText("");
  };

  const confirmReasonAction = () => {
    if (!reasonTarget || !reasonText.trim()) return;
    const { ad, action } = reasonTarget;
    if (action === "reject") rejectAd(ad.id, reasonText.trim());
    if (action === "suspend") suspendAd(ad.id, reasonText.trim());
    if (action === "ban") banAd(ad.id, reasonText.trim());
    setReasonTarget(null);
    setReasonText("");
  };

  const handleApprove = async (ad: Ad) => {
    const ok = await confirm({
      title: "Approve this ad?",
      message: `"${ad.title}" will go live immediately.`,
      confirmLabel: "Approve",
    });
    if (!ok) return;
    const success = await approveAd(ad.id);
    toast[success ? "success" : "error"](success ? "Ad approved." : "Couldn't approve the ad.");
  };

  const handleReinstate = async (ad: Ad) => {
    const ok = await confirm({
      title: "Reinstate this ad?",
      message: `"${ad.title}" will go live again.`,
      confirmLabel: "Reinstate",
    });
    if (!ok) return;
    const success = await reinstateAd(ad.id);
    toast[success ? "success" : "error"](success ? "Ad reinstated." : "Couldn't reinstate the ad.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Ad Moderation</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {pendingCount} awaiting review
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {(["pending", "approved", "all"] as FilterTab[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tab,
                { backgroundColor: active ? colors.primary : colors.backgroundElement },
              ]}
            >
              <Text style={[styles.tabText, { color: active ? "#fff" : colors.textSecondary }]}>
                {t === "pending" ? "Pending" : t === "approved" ? "Live" : "All"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={36}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nothing here right now.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Pressable
              onPress={() => router.push({ pathname: "/ads/ad-market-details", params: { id: item.id } })}
            >
              <View style={styles.cardTopRow}>
                <AdStatusPill status={item.status} compact />
                <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
                  {format(item.createdAt)}
                </Text>
              </View>
              <Text style={[styles.adTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.advertiser, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.advertiser.name} · {item.category}
                {item.fdaApprovalId ? ` · FDA ${item.fdaApprovalId}` : ""}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.text}
              </Text>
              <Text style={[styles.paymentText, { color: colors.textSecondary }]}>
                {item.plan.name} · {item.payment.currency} {formatAmount(item.payment.amount)} (
                {item.payment.status})
              </Text>
            </Pressable>

            <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
              {item.status === "pending" && (
                <>
                  <Pressable
                    onPress={() => handleApprove(item)}
                    style={[styles.actionButton, { backgroundColor: colors.success + "18" }]}
                  >
                    <MaterialCommunityIcons name="check" size={14} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openReasonPrompt(item, "reject")}
                    style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}
                  >
                    <MaterialCommunityIcons name="close" size={14} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                  </Pressable>
                </>
              )}
              {item.status === "approved" && (
                <>
                  <Pressable
                    onPress={() => openReasonPrompt(item, "suspend")}
                    style={[styles.actionButton, { backgroundColor: colors.warning + "18" }]}
                  >
                    <MaterialCommunityIcons name="pause" size={14} color={colors.warning} />
                    <Text style={[styles.actionText, { color: colors.warning }]}>Suspend</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openReasonPrompt(item, "ban")}
                    style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}
                  >
                    <MaterialCommunityIcons name="cancel" size={14} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Ban</Text>
                  </Pressable>
                </>
              )}
              {item.status === "suspended" && (
                <>
                  <Pressable
                    onPress={() => handleReinstate(item)}
                    style={[styles.actionButton, { backgroundColor: colors.success + "18" }]}
                  >
                    <MaterialCommunityIcons name="play" size={14} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Reinstate</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openReasonPrompt(item, "ban")}
                    style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}
                  >
                    <MaterialCommunityIcons name="cancel" size={14} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Ban</Text>
                  </Pressable>
                </>
              )}
              {(item.status === "rejected" || item.status === "banned") && (
                <Text style={[styles.finalizedText, { color: colors.textSecondary }]}>
                  {item.statusReason}
                </Text>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={!!reasonTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {reasonTarget?.action === "reject" && "Reject ad"}
              {reasonTarget?.action === "suspend" && "Suspend ad"}
              {reasonTarget?.action === "ban" && "Ban ad"}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Give the advertiser a reason — they'll see this on the ad.
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Reason..."
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.modalInput,
                { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border },
              ]}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setReasonTarget(null)}
                style={[styles.modalButton, { backgroundColor: colors.backgroundElement }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmReasonAction}
                disabled={!reasonText.trim()}
                style={[
                  styles.modalButton,
                  { backgroundColor: reasonText.trim() ? colors.error : colors.backgroundElement },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: reasonText.trim() ? "#fff" : colors.textSecondary },
                  ]}
                >
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  tabText: { fontSize: 12, fontWeight: "600" },
  listContent: { padding: 16, paddingTop: 0, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
  emptyText: { fontSize: 13 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeAgo: { fontSize: 11 },
  adTitle: { fontSize: 15, fontWeight: "600" },
  advertiser: { fontSize: 12 },
  body: { fontSize: 12, lineHeight: 17 },
  paymentText: { fontSize: 11, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  finalizedText: { fontSize: 11, flex: 1, lineHeight: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { borderRadius: 16, padding: 18, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSubtitle: { fontSize: 12 },
  modalInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalButton: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  modalButtonText: { fontSize: 14, fontWeight: "600" },
});
