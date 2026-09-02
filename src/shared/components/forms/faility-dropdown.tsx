import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
    <View className="w-full">
      <TouchableOpacity
        className="flex-row items-center justify-between px-3 py-3 rounded-md border"
        style={{
          backgroundColor: error ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: error ? colors.error : isOpen ? colors.backgroundElement : colors.border,
        }}
        onPress={toggleBottomSheet}
        activeOpacity={0.7}
      >
        <Text
          className="text-sm font-medium flex-1"
          style={{ color: selectedFacility ? colors.text : colors.textSecondary }}
        >
          {selectedFacility?.name || placeholder}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={error ? colors.error : colors.textSecondary}
          style={isOpen ? { marginLeft: 8, transform: [{ rotate: "180deg" }] } : { marginLeft: 8 }}
        />
      </TouchableOpacity>

      {error && (
        <Text className="text-xs mt-1.5 font-medium" style={{ color: colors.error }}>{error}</Text>
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
        <View className="flex-1 p-5">
          <View className="pb-4 items-center">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
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
                  className="flex-row justify-between items-center px-4 py-3.5 border-b-[0.5px]"
                  style={{
                    borderBottomColor: colors.border,
                    backgroundColor: isSelected ? colors.backgroundElement : "transparent",
                  }}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.6}
                >
                  <Text
                    className="text-sm flex-1"
                    style={{ color: colors.text, fontWeight: isSelected ? "600" : "500" }}
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

export default FacilityDropdown;

