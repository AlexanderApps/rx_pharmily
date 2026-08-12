import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BsFlatList } from "@/shared/components/bs/bs-primitives";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { ChatLinkedEntity, ChatLinkedEntityType } from "@/features/chat/types/chat.types";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useMediscopeStore } from "@/features/mediscope/hooks/use-mediscope-data";
import { useDonationStore } from "@/features/donations/hooks/use-donation-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

export interface LinkPickerSheetHandle {
  open: () => void;
}

interface LinkPickerSheetProps {
  onSelect: (entity: ChatLinkedEntity) => void;
}

const TABS: { key: ChatLinkedEntityType; label: string; icon: string }[] = [
  { key: "rfq", label: "RFQs", icon: "file-document-outline" },
  { key: "mediscope", label: "Mediscope", icon: "heart-search" },
  { key: "donation", label: "Donations", icon: "heart-outline" },
];

export const LinkPickerSheet = forwardRef<
  LinkPickerSheetHandle,
  LinkPickerSheetProps
>(({ onSelect }, ref) => {
  const { colors } = useTheme();
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["70%"], []);

  const [tab, setTab] = useState<ChatLinkedEntityType>("rfq");
  const [query, setQuery] = useState("");

  useImperativeHandle(ref, () => ({
    open: () => {
      setTab("rfq");
      setQuery("");
      modalRef.current?.present();
    },
  }));

  const rxrfqMarketPlace = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const rxrfqFacilities = useProfileStore((state) => state.facilities);
  const mediscopeRequests = useMediscopeStore((state) => state.requests);
  const donations = useDonationStore((state) => state.donations);

  const linkableRfqs = useMemo<ChatLinkedEntity[]>(
    () =>
      rxrfqMarketPlace.map((rfq) => ({
        type: "rfq",
        id: rfq.id,
        code: rfq.code,
        title: rfq.description || rfq.code,
        subtitle: rxrfqFacilities.find((f) => f.id === rfq.facilityId)?.name,
        status: rfq.status,
      })),
    [rxrfqMarketPlace, rxrfqFacilities],
  );

  const linkableMediscope = useMemo<ChatLinkedEntity[]>(
    () =>
      mediscopeRequests.map((r) => ({
        type: "mediscope",
        id: r.id,
        code: r.code,
        title: r.product,
        subtitle: r.facilityName,
        status: r.status,
      })),
    [mediscopeRequests],
  );

  const linkableDonations = useMemo<ChatLinkedEntity[]>(
    () =>
      donations.map((d) => ({
        type: "donation",
        id: d.id,
        code: d.code,
        title: d.categories.length > 0 ? d.categories.join(", ") : d.code,
        subtitle: d.facilityName,
        status: d.status,
      })),
    [donations],
  );

  const source =
    tab === "rfq" ? linkableRfqs : tab === "mediscope" ? linkableMediscope : linkableDonations;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q),
    );
  }, [source, query]);

  const handleRuleTypeChange = (key: ChatLinkedEntityType) => {
    setTab(key);
    setQuery("");
  };

  const handleSelect = (item: ChatLinkedEntity) => {
    onSelect(item);
    modalRef.current?.dismiss();
  };

  return (
    <BottomSheet
      ref={modalRef}
      snapPoints={snapPoints}
      showHandle
      cornerRadius={20}
      padding={0}
      enablePanDownToClose
      backgroundColor={colors.backgroundSecondary}
    >
      {/* Outer flex column — fills the full sheet height */}
      <View style={styles.sheetBody}>
        {/* Fixed header: title/subtitle + type tabs + search */}
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Attach a link</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Share an RFQ, Mediscope request, or donation in this chat
          </Text>

          <View style={styles.tabRow}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => handleRuleTypeChange(t.key)}
                  style={[
                    styles.tab,
                    { backgroundColor: active ? colors.primary : colors.backgroundElement },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={15}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text
                    style={[styles.tabText, { color: active ? "#fff" : colors.textSecondary }]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
            <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${TABS.find((t) => t.key === tab)?.label ?? ""}...`}
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>

        {/* Expanding list — takes all remaining vertical space */}
        <View style={styles.listBlock}>
          <BsFlatList
            style={{ flex: 1 }}
            data={results}
            keyExtractor={(item: ChatLinkedEntity) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No matches found.
              </Text>
            }
            renderItem={({ item }: { item: ChatLinkedEntity }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.resultRow,
                  {
                    backgroundColor: pressed
                      ? colors.backgroundSelected
                      : colors.backgroundElement,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.resultIcon, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <MaterialCommunityIcons
                    name={
                      (item.type === "rfq"
                        ? "file-document-outline"
                        : item.type === "mediscope"
                          ? "heart-search"
                          : "heart-outline") as any
                    }
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultCode, { color: colors.textSecondary }]}>
                    {item.code}
                  </Text>
                  <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text
                      style={[styles.resultSubtitle, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          />
        </View>
      </View>
    </BottomSheet>
  );
});

LinkPickerSheet.displayName = "LinkPickerSheet";

export default LinkPickerSheet;

const styles = StyleSheet.create({
  sheetBody: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 20,
  },
  headerBlock: { flexShrink: 0 },
  listBlock: { flex: 1, marginTop: 4, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  tabRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tabText: { fontSize: 12, fontWeight: "600" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  listContent: { paddingBottom: 24, gap: 8 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCode: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  resultTitle: { fontSize: 13, fontWeight: "600", marginTop: 1 },
  resultSubtitle: { fontSize: 11, marginTop: 1 },
  emptyText: { textAlign: "center", fontSize: 13, marginTop: 24 },
});
