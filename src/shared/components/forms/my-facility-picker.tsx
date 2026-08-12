import React, { useMemo, useRef, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

interface MyFacilityPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

// Same props shape as the old FacilityDropdown so this drops straight into
// its call sites — the difference is entirely in where the facility list
// comes from: the real facilities table, scoped to facilities the current
// user actually belongs to, instead of a hardcoded 15-entry mock list.
const MyFacilityPicker: React.FC<MyFacilityPickerProps> = ({
  value,
  onChange,
  error,
  placeholder = "Select a facility",
}) => {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [isOpen, setIsOpen] = useState(false);
  const getMyFacilities = useProfileStore((state) => state.getMyFacilities);
  const facilities = getMyFacilities();

  const snapPoints = useMemo(() => ["50%", "75%"], []);
  const selected = useMemo(() => facilities.find((f) => f.id === value), [facilities, value]);

  const handleSelect = (facilityId: string) => {
    onChange(facilityId);
    sheetRef.current?.dismiss();
  };

  const toggleSheet = () => {
    if (isOpen) sheetRef.current?.dismiss();
    else sheetRef.current?.present();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: error ? colors.backgroundSecondary : colors.backgroundElement,
            borderColor: error ? colors.error : isOpen ? colors.backgroundElement : colors.border,
          },
        ]}
        onPress={toggleSheet}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, { color: selected ? colors.text : colors.textSecondary }]}>
          {selected?.name || placeholder}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={error ? colors.error : colors.textSecondary}
          style={[styles.icon, isOpen && styles.iconRotated]}
        />
      </TouchableOpacity>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        showHandle
        cornerRadius={16}
        padding={20}
        enablePanDownToClose
        onChange={(index) => setIsOpen(index !== -1)}
        backgroundColor={colors.backgroundSecondary}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Select Facility</Text>
        </View>

        {facilities.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You don't belong to any facility yet.
          </Text>
        ) : (
          facilities.map((item) => {
            const isSelected = value === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.optionItem,
                  { borderBottomColor: colors.border },
                  isSelected && { backgroundColor: colors.backgroundElement },
                ]}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.6}
              >
                <Text style={[styles.optionText, { color: colors.text }, isSelected && { fontWeight: "600" }]}>
                  {item.name}
                </Text>
                {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color={colors.text} />}
              </TouchableOpacity>
            );
          })
        )}
      </BottomSheet>
    </View>
  );
};

export default MyFacilityPicker;

const styles = StyleSheet.create({
  container: { width: "100%" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  buttonText: { fontSize: 14, fontWeight: "500", flex: 1 },
  icon: { marginLeft: 8 },
  iconRotated: { transform: [{ rotate: "180deg" }] },
  error: { fontSize: 12, marginTop: 6, fontWeight: "500" },
  sheetHeader: { paddingBottom: 16, alignItems: "center" },
  sheetTitle: { fontSize: 16, fontWeight: "600" },
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 24 },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  optionText: { fontSize: 14, fontWeight: "500", flex: 1 },
});
