import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BsFlatList } from "@/shared/components/bs/bs-primitives";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import {
  ChatLinkedEntity,
  ChatLinkedEntityType,
} from "@/features/chat/types/chat.types";
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
    tab === "rfq"
      ? linkableRfqs
      : tab === "mediscope"
        ? linkableMediscope
        : linkableDonations;

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
      <View className="flex-1 flex-col px-5">
        {/* Fixed header: title/subtitle + type tabs + search */}
        <View className="shrink-0">
          <Text className="text-base font-bold" style={{ color: colors.text }}>
            Attach a link
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: colors.textSecondary }}
          >
            Share an RFQ, Mediscope request, or donation in this chat
          </Text>

          <View className="flex-row gap-2 mt-3.5">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => handleRuleTypeChange(t.key)}
                  className="flex-row items-center gap-1.5 px-3 py-[7px] rounded-full"
                  style={{
                    backgroundColor: active
                      ? colors.primary
                      : colors.backgroundElement,
                  }}
                >
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={15}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color: active ? "#fff" : colors.textSecondary,
                    }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            className="flex-row items-center gap-2 mt-3 px-3 py-[9px] rounded-[10px]"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={16}
              color={colors.textSecondary}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${TABS.find((t) => t.key === tab)?.label ?? ""}...`}
              placeholderTextColor={colors.textSecondary}
              className="flex-1 text-[13px] p-0"
              style={{ color: colors.text }}
            />
          </View>
        </View>

        {/* Expanding list — takes all remaining vertical space */}
        <View className="flex-1 mt-1 mb-5">
          <BsFlatList
            className="flex-1"
            data={results}
            keyExtractor={(item: ChatLinkedEntity) => `${item.type}-${item.id}`}
            contentContainerClassName="pb-6 gap-2"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text
                className="text-center text-[13px] mt-6"
                style={{ color: colors.textSecondary }}
              >
                No matches found.
              </Text>
            }
            renderItem={({ item }: { item: ChatLinkedEntity }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                className="flex-row items-center gap-2.5 border rounded-xl p-2.5"
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? colors.backgroundSelected
                    : colors.backgroundElement,
                  borderColor: colors.border,
                })}
              >
                <View
                  className="w-8 h-8 rounded-[9px] items-center justify-center"
                  style={{ backgroundColor: colors.backgroundSecondary }}
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
                <View className="flex-1">
                  <Text
                    className="text-[10px] font-semibold uppercase"
                    style={{ color: colors.textSecondary }}
                  >
                    {item.code}
                  </Text>
                  <Text
                    className="text-[13px] font-semibold mt-px"
                    style={{ color: colors.text }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text
                      className="text-[11px] mt-px"
                      style={{ color: colors.textSecondary }}
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
