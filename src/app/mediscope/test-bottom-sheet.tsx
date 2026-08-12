import { useCallback, useMemo, useRef, useState } from "react";
import { Button, StyleSheet, View, Text } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  GestureHandlerRootView,
  Pressable,
} from "react-native-gesture-handler";

import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { useTheme } from "@/shared/hooks/use-theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type IncotermOption = {
  code: string;
  label?: string;
  description: string;
  category: "Any Mode" | "Sea/Waterway Only" | "None";
};

const INCOTERM_OPTIONS: IncotermOption[] = [
  {
    code: "",
    label: "None",
    description: "No specific Incoterm applied to this request",
    category: "None",
  },
  {
    code: "EXW",
    label: "EXW (Ex Works)",
    description:
      "Buyer handles all transport, loading, and customs from factory floor",
    category: "Any Mode",
  },
  {
    code: "FCA",
    label: "FCA (Free Carrier)",
    description:
      "Seller delivers to buyer's carrier at a named terminal location",
    category: "Any Mode",
  },
  {
    code: "CPT",
    label: "CPT (Carriage Paid To)",
    description:
      "Seller pays main freight transport to port; risk shifts to buyer there",
    category: "Any Mode",
  },
  {
    code: "CIP",
    label: "CIP (Carriage & Insurance Paid)",
    description:
      "Seller covers freight and mandatory high-level clinical insurance protection",
    category: "Any Mode",
  },
  {
    code: "DAP",
    label: "DAP (Delivered At Place)",
    description:
      "Seller delivers straight to buyer facility/hospital; buyer handles unloading",
    category: "Any Mode",
  },
  {
    code: "DPU",
    label: "DPU (Delivered Place Unloaded)",
    description:
      "Seller unloads medical equipment directly into buyer's facility/depot",
    category: "Any Mode",
  },
  {
    code: "DDP",
    label: "DDP (Delivered Duty Paid)",
    description:
      "Seller delivers with all local customs clearance and cross-border duties paid",
    category: "Any Mode",
  },
  {
    code: "FOB",
    label: "FOB (Free On Board)",
    description:
      "Seller clears customs and loads cargo onto marine vessel deck",
    category: "Sea/Waterway Only",
  },
  {
    code: "CIF",
    label: "CIF (Cost, Insurance & Freight)",
    description:
      "Seller pays ocean freight and marine transit insurance parameters to destination port",
    category: "Sea/Waterway Only",
  },
];

export default function TestBottomSheet() {
  const sheetRef = useRef<BottomSheet>(null);

  const { colors } = useTheme();

  // variables
  const data = useMemo(
    () =>
      Array(50)
        .fill(0)
        .map((_, index) => `index-${index}`),
    [],
  );
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  const [isSelected, setIsSelected] = useState(false);

  // callbacks
  const handleSheetChange = useCallback((index: any) => {
    console.log("handleSheetChange", index);
  }, []);
  const handleSnapPress = useCallback((index: number) => {
    sheetRef.current?.snapToIndex(index);
  }, []);
  const handleClosePress = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  // render
  const renderItem = useCallback(
    (item: string) => (
      <View key={item} style={styles.itemContainer}>
        <Text>{item}</Text>
      </View>
    ),
    [],
  );

  const handleSelect = (code: string) => {
    // onChange(code);
    // setVisible(false);
  };

  const renderItem2 = useCallback(
    (item: IncotermOption) => (
      <Pressable
        onPress={() => handleSelect(item.code)}
        style={[
          styles.optionRow,
          {
            borderBottomColor: colors.border,
          },
          isSelected && {
            backgroundColor: `${colors.primary}10`,
          },
        ]}
      >
        <View style={styles.optionContent}>
          <View
            style={[
              styles.codeBadge,
              {
                backgroundColor:
                  item.code === "" ? colors.border : `${colors.primary}15`,
              },
            ]}
          >
            <Text
              style={[
                styles.codeBadgeText,
                {
                  color:
                    item.code === "" ? colors.textSecondary : colors.primary,
                },
              ]}
            >
              {item.code || "NONE"}
            </Text>
          </View>

          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              {item.label}
            </Text>

            <Text
              style={[
                styles.optionDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {item.description}
            </Text>
          </View>
        </View>

        {isSelected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={22}
            color={colors.primary}
          />
        )}
      </Pressable>
    ),
    [isSelected],
  );
  return (
    // <GestureHandlerRootView style={styles.container}>
    <View style={styles.container}>
      <Button title="Snap To 90%" onPress={() => handleSnapPress(2)} />
      <Button title="Snap To 50%" onPress={() => handleSnapPress(1)} />
      <Button title="Snap To 25%" onPress={() => handleSnapPress(0)} />
      <Button title="Close" onPress={() => handleClosePress()} />
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        onChange={handleSheetChange}
      >
        <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
          {INCOTERM_OPTIONS.map(renderItem2)}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
    // </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 200,
  },
  contentContainer: {
    backgroundColor: "white",
  },
  itemContainer: {
    padding: 6,
    margin: 6,
    backgroundColor: "#eee",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  triggerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  triggerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },

  errorText: {
    fontSize: 12,
  },

  modalContainer: {
    flex: 1,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  closeButton: {
    padding: 4,
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  listContent: {
    paddingBottom: 32,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  optionContent: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },

  codeBadge: {
    width: 60,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    alignSelf: "flex-start",
  },

  codeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  optionTextContainer: {
    flex: 1,
  },

  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  optionDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },
});
