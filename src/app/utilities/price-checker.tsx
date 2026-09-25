import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
import MyFacilityPicker from "@/shared/components/forms/my-facility-picker";
import { useProfileStore, useMyFacilities } from "@/features/profile/hooks/use-profile-data";
import { PriceTemplateItem } from "@/features/profile/types/profile.types";
import { formatAmount } from "@/shared/utils/format";

// One row in the results list — a price_template_item plus which price
// list it came from, since more than one list can be selected at once
// and the whole point of that is comparing the same product's price
// across lists side by side.
interface PriceResult {
  item: PriceTemplateItem;
  templateId: string;
  templateTitle: string;
}

export default function PriceCheckerScreen() {
  const { colors } = useTheme();
  const priceTemplates = useProfileStore((state) => state.priceTemplates);
  const fetchPriceTemplates = useProfileStore((state) => state.fetchPriceTemplates);
  const myFacilities = useMyFacilities();

  const [isLoading, setIsLoading] = useState(true);
  const [facilityId, setFacilityId] = useState("");
  // A Set, not an array — toggling one price list on/off is a lookup +
  // add/remove, which a Set does directly; an array would need an
  // indexOf/filter dance for the same operation on every tap.
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  // price_templates isn't preloaded at app launch (unlike facilities) —
  // every other screen that needs it (price-templates.tsx, the RxRFQ
  // response form's PriceComboBox) fetches it on its own mount the same
  // way, so this follows that same established pattern rather than
  // assuming it's already populated.
  useEffect(() => {
    fetchPriceTemplates().finally(() => setIsLoading(false));
  }, [fetchPriceTemplates]);

  // Skips a step that has only one possible answer — belonging to just
  // one facility means there's nothing to actually choose.
  useEffect(() => {
    if (!facilityId && myFacilities.length === 1) {
      setFacilityId(myFacilities[0].id);
    }
  }, [facilityId, myFacilities]);

  const facilityPriceLists = useMemo(
    () => priceTemplates.filter((t) => t.facilityId === facilityId),
    [priceTemplates, facilityId],
  );

  // Selecting a different facility invalidates whatever price lists
  // were chosen for the previous one.
  useEffect(() => {
    setSelectedTemplateIds(new Set());
    setQuery("");
  }, [facilityId]);

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  };

  const results = useMemo((): PriceResult[] => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || selectedTemplateIds.size === 0) return [];

    const rows: PriceResult[] = [];
    for (const template of facilityPriceLists) {
      if (!selectedTemplateIds.has(template.id)) continue;
      for (const item of template.items) {
        if (item.product.toLowerCase().includes(trimmed)) {
          rows.push({ item, templateId: template.id, templateTitle: template.title });
        }
      }
    }
    // Alphabetical by product first so the same item's entries from
    // different lists land next to each other, which is the whole
    // point of comparing prices across lists at a glance.
    return rows.sort((a, b) => a.item.product.localeCompare(b.item.product));
  }, [facilityPriceLists, selectedTemplateIds, query]);

  const selectedCount = selectedTemplateIds.size;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Price Checker" subtitle="Look up an item's price across your facility's price lists" />

      <View className="px-4 pt-4 gap-3">
        <View>
          <Text className="text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>
            Facility
          </Text>
          <MyFacilityPicker value={facilityId} onChange={setFacilityId} />
        </View>

        {!!facilityId && facilityPriceLists.length > 0 && (
          <View>
            <Text className="text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>
              Price list{facilityPriceLists.length > 1 ? "s" : ""} ({selectedCount} selected)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {facilityPriceLists.map((template) => {
                const isSelected = selectedTemplateIds.has(template.id);
                return (
                  <Pressable
                    key={template.id}
                    onPress={() => toggleTemplate(template.id)}
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
                    style={{
                      backgroundColor: isSelected ? colors.primary + "18" : colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? "check-circle" : "file-document-outline"}
                      size={14}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: isSelected ? colors.primary : colors.text }}
                      numberOfLines={1}
                    >
                      {template.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {selectedCount > 0 && (
          <View
            className="flex-row items-center gap-2 border rounded-[10px] px-3 py-[11px]"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border }}
          >
            <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for an item..."
              placeholderTextColor={colors.textSecondary}
              className="flex-1 text-sm p-0"
              style={{ color: colors.text }}
              autoFocus
            />
          </View>
        )}
      </View>

      <View className="flex-1 mt-2">
        {!isLoading && myFacilities.length === 0 ? (
          <EmptyState icon="office-building-marker-outline" message="You don't belong to any facility yet." />
        ) : !facilityId ? (
          <EmptyState icon="office-building-outline" message="Select a facility to get started." />
        ) : facilityPriceLists.length === 0 ? (
          <EmptyState icon="file-document-outline" message="This facility has no price lists uploaded yet." />
        ) : selectedCount === 0 ? (
          <EmptyState icon="checkbox-marked-circle-outline" message="Select at least one price list to search." />
        ) : query.trim().length === 0 ? (
          <EmptyState icon="text-box-search-outline" message="Type a product name to see its price." />
        ) : results.length === 0 ? (
          <EmptyState icon="magnify-close" message={`No matches for "${query.trim()}" in the selected price list${selectedCount > 1 ? "s" : ""}.`} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(row) => `${row.templateId}:${row.item.id}`}
            contentContainerClassName="px-4 pb-6 gap-2"
            renderItem={({ item: row }) => (
              <View
                className="flex-row items-center justify-between rounded-xl border px-3.5 py-3"
                style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
                    {row.item.product}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <MaterialCommunityIcons name="file-document-outline" size={11} color={colors.textSecondary} />
                    <Text className="text-[11px]" style={{ color: colors.textSecondary }} numberOfLines={1}>
                      {row.templateTitle}
                      {row.item.unit ? ` · Per ${row.item.unit}` : ""}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                  {formatAmount(row.item.rate)}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
