import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
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
  // Only donation-claim-sheet.tsx passes this — it's itself a
  // BottomSheet, and nesting a second @gorhom/bottom-sheet instance
  // inside another one's content causes a real, confirmed gesture
  // conflict on native (both sheets' pan handlers become active in the
  // same gesture context, so dragging the inner one can fight the
  // outer one). A plain Modal doesn't use gorhom's gesture-handler
  // system at all, so it nests safely. Every other consumer of this
  // component is a full-screen form (not itself a sheet), so they keep
  // the richer drag-to-dismiss BottomSheet behavior unchanged by
  // default — this is opt-in, not a global switch.
  renderAsModal?: boolean;
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
  renderAsModal = false,
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
    if (renderAsModal) {
      setIsOpen(false);
    } else {
      sheetRef.current?.dismiss();
    }
  };

  const toggleSheet = () => {
    if (renderAsModal) {
      setIsOpen((prev) => !prev);
      return;
    }
    if (isOpen) sheetRef.current?.dismiss();
    else sheetRef.current?.present();
  };

  const listContent = (
    <>
      <View className="pb-4 items-center">
        <Text className="text-base font-semibold" style={{ color: colors.text }}>Select Facility</Text>
      </View>

      {facilities.length === 0 ? (
        <Text className="text-[13px] text-center py-6" style={{ color: colors.textSecondary }}>
          You don't belong to any facility yet.
        </Text>
      ) : (
        facilities.map((item) => {
          const isSelected = value === item.id;
          return (
            <TouchableOpacity
              key={item.id}
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
              {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color={colors.text} />}
            </TouchableOpacity>
          );
        })
      )}
    </>
  );

  return (
    <View className="w-full">
      <TouchableOpacity
        className="flex-row items-center justify-between px-3 py-3 rounded-md border"
        style={{
          backgroundColor: error ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: error ? colors.error : isOpen ? colors.backgroundElement : colors.border,
        }}
        onPress={toggleSheet}
        activeOpacity={0.7}
      >
        <Text className="text-sm font-medium flex-1" style={{ color: selected ? colors.text : colors.textSecondary }}>
          {selected?.name || placeholder}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={error ? colors.error : colors.textSecondary}
          style={isOpen ? { marginLeft: 8, transform: [{ rotate: "180deg" }] } : { marginLeft: 8 }}
        />
      </TouchableOpacity>

      {error && <Text className="text-xs mt-1.5 font-medium" style={{ color: colors.error }}>{error}</Text>}

      {renderAsModal ? (
        <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
          <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setIsOpen(false)}>
            {/* Swallow taps on the panel itself so they don't fall
                through to the backdrop and close this before an item's
                own onPress fires. */}
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                className="rounded-t-2xl px-5 pt-5"
                style={{ backgroundColor: colors.backgroundSecondary, maxHeight: "70%", paddingBottom: 24 }}
              >
                {listContent}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
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
          {listContent}
        </BottomSheet>
      )}
    </View>
  );
};

export default MyFacilityPicker;
