import { useCallback, useMemo, useRef, useState } from "react";
import { Button, View, Text } from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Pressable } from "react-native-gesture-handler";
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

  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  const [isSelected, setIsSelected] = useState(false);

  const handleSheetChange = useCallback((index: any) => {
    console.log("handleSheetChange", index);
  }, []);

  const handleSnapPress = useCallback((index: number) => {
    sheetRef.current?.snapToIndex(index);
  }, []);

  const handleClosePress = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const handleSelect = (code: string) => {
    // onChange(code);
    // setVisible(false);
  };

  const renderItem2 = useCallback(
    (item: IncotermOption) => (
      <Pressable
        onPress={() => handleSelect(item.code)}
        className="flex-row items-center justify-between px-4 py-4 border-b"
        style={[
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: `${colors.primary}10` },
        ]}
      >
        <View className="flex-row flex-1 gap-3">
          <View
            className="w-[60px] rounded-md items-center justify-center py-1.5 self-start"
            style={{
              backgroundColor:
                item.code === "" ? colors.border : `${colors.primary}15`,
            }}
          >
            <Text
              className="text-[11px] font-bold"
              style={{
                color: item.code === "" ? colors.textSecondary : colors.primary,
              }}
            >
              {item.code || "NONE"}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {item.label}
            </Text>
            <Text
              className="mt-1 text-xs leading-[18px]"
              style={{ color: colors.textSecondary }}
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
    [isSelected, colors],
  );

  return (
    <View className="flex-1 pt-[200px]">
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
        <BottomSheetScrollView contentContainerClassName="bg-white">
          {INCOTERM_OPTIONS.map(renderItem2)}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}