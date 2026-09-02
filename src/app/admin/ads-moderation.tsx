import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Redirect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { Ad } from "@/features/ads/types/ads.types";
import AdStatusPill from "@/features/ads/components/ad-status-pill";
import { formatAmount } from "@/shared/utils/format";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";

type FilterTab = "pending" | "approved" | "all" | "reports";
type ReasonAction = "reject" | "suspend" | "ban";

export default function AdModerationScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const ads = useAdsStore((state) => state.ads);
  const approveAd = useAdsStore((state) => state.approveAd);
  const rejectAd = useAdsStore((state) => state.rejectAd);
  const suspendAd = useAdsStore((state) => state.suspendAd);
  const reinstateAd = useAdsStore((state) => state.reinstateAd);
  const banAd = useAdsStore((state) => state.banAd);
  const adReports = useAdsStore((state) => state.adReports);
  const fetchAdReports = useAdsStore((state) => state.fetchAdReports);
  const dismissReport = useAdsStore((state) => state.dismissReport);

  useEffect(() => {
    fetchAdReports();
  }, []);

  const [tab, setTab] = useState<FilterTab>("pending");
  const [reasonTarget, setReasonTarget] = useState<{ ad: Ad; action: ReasonAction } | null>(
    null,
  );
  const [reasonText, setReasonText] = useState("");

  const openReports = useMemo(
    () =>
      [...adReports]
        .filter((r) => r.status === "open")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [adReports],
  );

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
    if (ad.payment.status !== "paid") {
      toast.error("This ad's payment hasn't been marked paid yet — check Payments.");
      return;
    }
    const ok = await confirm({
      title: "Approve this ad?",
      message: `"${ad.title}" will go live immediately.`,
      confirmLabel: "Approve",
    });
    if (!ok) return;
    const success = await approveAd(ad.id);
    toast[success ? "success" : "error"](
      success ? "Ad approved." : "Couldn't approve the ad.",
    );
  };

  const handleReinstate = async (ad: Ad) => {
    const ok = await confirm({
      title: "Reinstate this ad?",
      message: `"${ad.title}" will go live again.`,
      confirmLabel: "Reinstate",
    });
    if (!ok) return;
    const success = await reinstateAd(ad.id);
    toast[success ? "success" : "error"](
      success ? "Ad reinstated." : "Couldn't reinstate the ad.",
    );
  };

  const handleDismissReport = async (reportId: string) => {
    const ok = await dismissReport(reportId);
    toast[ok ? "success" : "error"](ok ? "Report dismissed." : "Couldn't dismiss the report.");
  };

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

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
      {/* Header */}
      <ScreenHeader title="Ad Moderation" subtitle={`${pendingCount} awaiting review`} />

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 py-3">
        {(["pending", "approved", "all", "reports"] as FilterTab[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className="flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full"
              style={{
                backgroundColor: active ? colors.primary : colors.backgroundElement,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: active ? "#fff" : colors.textSecondary }}
              >
                {t === "pending" ? "Pending" : t === "approved" ? "Live" : t === "reports" ? "Reports" : "All"}
              </Text>
              {t === "reports" && openReports.length > 0 && (
                <View
                  className="min-w-[16px] h-4 rounded-full items-center justify-center px-1"
                  style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : colors.error }}
                >
                  <Text className="text-[10px] font-bold" style={{ color: active ? "#fff" : "#fff" }}>
                    {openReports.length}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {tab === "reports" ? (
        <FlatList
          data={openReports}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-4 grow"
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <View className="items-center justify-center gap-2.5 pt-16">
              <MaterialCommunityIcons name="flag-outline" size={36} color={colors.textSecondary} />
              <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                No open reports.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const reportedAd = ads.find((a) => a.id === item.adId);
            return (
              <View
                className="rounded-[14px] border p-3.5 gap-1.5"
                style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.error }}>
                    Reported by {item.reporterName}
                  </Text>
                  <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                    {format(item.createdAt)}
                  </Text>
                </View>
                <Text className="text-[15px] font-semibold" style={{ color: colors.text }} numberOfLines={1}>
                  {reportedAd?.title ?? "(ad no longer available)"}
                </Text>
                <Text className="text-xs leading-[17px]" style={{ color: colors.textSecondary }}>
                  {item.reason}
                </Text>
                <View className="flex-row gap-2 border-t pt-2.5 mt-0.5" style={{ borderTopColor: colors.border }}>
                  {reportedAd && (
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: "/ads/ad-market-details", params: { id: reportedAd.id } })
                      }
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: colors.backgroundElement }}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={14} color={colors.text} />
                      <Text className="text-xs font-bold" style={{ color: colors.text }}>
                        View ad
                      </Text>
                    </Pressable>
                  )}
                  {reportedAd && reportedAd.status === "approved" && (
                    <>
                      <Pressable
                        onPress={() => openReasonPrompt(reportedAd, "suspend")}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: colors.warning + "18" }}
                      >
                        <MaterialCommunityIcons name="pause" size={14} color={colors.warning} />
                        <Text className="text-xs font-bold" style={{ color: colors.warning }}>
                          Suspend
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => openReasonPrompt(reportedAd, "ban")}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: colors.error + "18" }}
                      >
                        <MaterialCommunityIcons name="cancel" size={14} color={colors.error} />
                        <Text className="text-xs font-bold" style={{ color: colors.error }}>
                          Ban
                        </Text>
                      </Pressable>
                    </>
                  )}
                  <Pressable
                    onPress={() => handleDismissReport(item.id)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: colors.backgroundElement }}
                  >
                    <MaterialCommunityIcons name="close" size={14} color={colors.textSecondary} />
                    <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                      Ignore
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-4 grow"
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListEmptyComponent={
          <View className="items-center justify-center gap-2.5 pt-16">
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={36}
              color={colors.textSecondary}
            />
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              Nothing here right now.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            className="rounded-[14px] border p-3.5 gap-1.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/ads/ad-market-details",
                  params: { id: item.id },
                })
              }
            >
              <View className="flex-row items-center justify-between">
                <AdStatusPill status={item.status} compact />
                <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                  {format(item.createdAt)}
                </Text>
              </View>
              <Text
                className="text-[15px] font-semibold"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                className="text-xs"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {item.advertiser.name} · {item.category}
                {item.fdaApprovalId ? ` · FDA ${item.fdaApprovalId}` : ""}
              </Text>
              <Text
                className="text-xs leading-[17px]"
                style={{ color: colors.textSecondary }}
                numberOfLines={2}
              >
                {item.text}
              </Text>
              <Text
                className="text-[11px] font-semibold"
                style={{ color: colors.textSecondary }}
              >
                {item.plan.name} · {item.payment.currency}{" "}
                {formatAmount(item.payment.amountDue)} ({item.payment.status})
              </Text>
            </Pressable>

            <View
              className="flex-row gap-2 border-t pt-2.5 mt-0.5"
              style={{ borderTopColor: colors.border }}
            >
              {item.status === "pending" && (
                <>
                  <Pressable
                    onPress={() => handleApprove(item)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: colors.success + "18" }}
                  >
                    <MaterialCommunityIcons name="check" size={14} color={colors.success} />
                    <Text className="text-xs font-bold" style={{ color: colors.success }}>
                      Approve
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openReasonPrompt(item, "reject")}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: colors.error + "18" }}
                  >
                    <MaterialCommunityIcons name="close" size={14} color={colors.error} />
                    <Text className="text-xs font-bold" style={{ color: colors.error }}>
                      Reject
                    </Text>
                  </Pressable>
                </>
              )}

              {item.status === "approved" && (
                <>
                  <Pressable
                    onPress={() => openReasonPrompt(item, "suspend")}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: colors.warning + "18" }}
                  >
                    <MaterialCommunityIcons name="pause" size={14} color={colors.warning} />
                    <Text className="text-xs font-bold" style={{ color: colors.warning }}>
                      Suspend
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openReasonPrompt(item, "ban")}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: colors.error + "18" }}
                  >
                    <MaterialCommunityIcons name="cancel" size={14} color={colors.error} />
                    <Text className="text-xs font-bold" style={{ color: colors.error }}>
                      Ban
                    </Text>
                  </Pressable>
                </>
              )}

              {item.status === "suspended" && (
                <>
                  <Pressable
                    onPress={() => handleReinstate(item)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: colors.success + "18" }}
                  >
                    <MaterialCommunityIcons name="play" size={14} color={colors.success} />
                    <Text className="text-xs font-bold" style={{ color: colors.success }}>
                      Reinstate
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openReasonPrompt(item, "ban")}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: colors.error + "18" }}
                  >
                    <MaterialCommunityIcons name="cancel" size={14} color={colors.error} />
                    <Text className="text-xs font-bold" style={{ color: colors.error }}>
                      Ban
                    </Text>
                  </Pressable>
                </>
              )}

              {(item.status === "rejected" || item.status === "suspended" || item.status === "banned") && (
                <View className="flex-1">
                  <Text
                    className="text-[11px] leading-[15px]"
                    style={{ color: colors.textSecondary }}
                  >
                    {item.statusReason}
                  </Text>
                  {item.reviewedByName && (
                    <Text className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                      — {item.reviewedByName}
                      {item.reviewedAt ? `, ${format(item.reviewedAt)}` : ""}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      />
      )}

      {/* Reason modal */}
      <Modal visible={!!reasonTarget} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View
            className="rounded-2xl p-[18px] gap-2.5"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              {reasonTarget?.action === "reject" && "Reject ad"}
              {reasonTarget?.action === "suspend" && "Suspend ad"}
              {reasonTarget?.action === "ban" && "Ban ad"}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Give the advertiser a reason — they'll see this on the ad.
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Reason..."
              placeholderTextColor={colors.textSecondary}
              className="min-h-20 border rounded-[10px] p-3 text-sm"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
                textAlignVertical: "top",
              }}
              multiline
              autoFocus
            />
            <View className="flex-row gap-2.5 mt-1">
              <Pressable
                onPress={() => setReasonTarget(null)}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmReasonAction}
                disabled={!reasonText.trim()}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{
                  backgroundColor: reasonText.trim()
                    ? colors.error
                    : colors.backgroundElement,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: reasonText.trim() ? "#fff" : colors.textSecondary,
                  }}
                >
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}