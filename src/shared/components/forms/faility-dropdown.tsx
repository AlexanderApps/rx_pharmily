import React, { useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BsFlatList as BottomSheetFlatList } from "@/shared/components/bs/bs-primitives";

interface FacilityDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

const FACILITIES = [
  { id: "1", name: "Tema Pharmacy" },
  { id: "2", name: "Korle-Bu Dispensary" },
  { id: "3", name: "CityMed Clinic" },
  { id: "4", name: "Trust Hospital Pharmacy" },
  { id: "5", name: "New Pharm Ltd" },
  { id: "6", name: "Ghana Med Supplies" },
  { id: "7", name: "Eastern Pharma Depot" },
  { id: "8", name: "Sante Logistique" },
  { id: "9", name: "Komfo Anokye Teaching Hospital" },
  { id: "10", name: "Ridge Hospital Pharmacy" },
  { id: "11", name: "Batsona Clinic" },
  { id: "12", name: "Tamale Central Pharmacy" },
  { id: "13", name: "Airport Medical Centre" },
  { id: "14", name: "Koforidua Regional Hospital" },
  { id: "15", name: "Ho Municipal Dispensary" },
];

const FacilityDropdown: React.FC<FacilityDropdownProps> = ({
  value,
  onChange,
  error,
  placeholder = "Select a facility",
}) => {
  const { colors } = useTheme();
  const filterModalRef = useRef<BottomSheetModal>(null);
  const [isOpen, setIsOpen] = useState(false);

  const snapPoints = useMemo(() => ["50%", "75%"], []);
  const selectedFacility = useMemo(
    () => FACILITIES.find((f) => f.id === value),
    [value],
  );

  const handleSelect = (facilityId: string) => {
    onChange(facilityId);
    filterModalRef.current?.dismiss();
  };

  const toggleBottomSheet = () => {
    if (isOpen) {
      filterModalRef.current?.dismiss();
    } else {
      filterModalRef.current?.present();
    }
  };

  const handleBottomSheetChange = (index: number) => {
    // index is -1 when the sheet is completely closed/dismissed
    setIsOpen(index !== -1);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: error
              ? colors.backgroundSecondary
              : colors.backgroundElement,
            borderColor: error
              ? colors.error
              : isOpen
                ? colors.backgroundElement
                : colors.border,
          },
        ]}
        onPress={toggleBottomSheet}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            { color: selectedFacility ? colors.text : colors.textSecondary },
          ]}
        >
          {selectedFacility?.name || placeholder}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={error ? colors.error : colors.textSecondary}
          style={[styles.icon, isOpen && styles.iconRotated]}
        />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      <BottomSheet
        ref={filterModalRef}
        snapPoints={snapPoints}
        showHandle={true}
        cornerRadius={16}
        padding={20}
        enablePanDownToClose
        onChange={handleBottomSheetChange}
        backgroundColor={colors.backgroundSecondary}
      >
        <View style={{ flex: 1, padding: 20 }}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Select Facility
            </Text>
          </View>
          <BottomSheetFlatList
            data={FACILITIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = value === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.backgroundElement },
                  ]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.text },
                      isSelected && { fontWeight: "600" },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={colors.text}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  icon: {
    marginLeft: 8,
  },
  iconRotated: {
    transform: [{ rotate: "180deg" }],
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  bottomSheetHeader: {
    paddingBottom: 16,
    alignItems: "center",
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});

export default FacilityDropdown;
