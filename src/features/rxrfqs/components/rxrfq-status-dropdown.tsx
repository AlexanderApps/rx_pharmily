import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RxRfqStatusType } from "@/features/rxrfqs/types/rxrfqs.types";

interface StatusDropdownProps {
  value: RxRfqStatusType;
  onChange: (value: RxRfqStatusType) => void;
  label?: string;
}

type StatusOption = {
  id: string;
  value: RxRfqStatusType;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  description: string;
  getColor: () => string;
};

// 2. Updated data array with new statuses, icons, and semantics
const getStatusOptions = (colors: any): StatusOption[] => [
  {
    id: "1",
    value: "draft",
    label: "Draft",
    icon: "file-document-edit-outline",
    description: "In progress and hidden from public",
    getColor: () => colors.textSecondary || "#6c757d",
  },
  {
    id: "2",
    value: "published",
    label: "Published",
    icon: "earth",
    description: "Active and visible to everyone",
    getColor: () => colors.success || "#28a745",
  },
  {
    id: "3",
    value: "closed",
    label: "Closed",
    icon: "lock",
    description: "No longer accepting submissions",
    getColor: () => colors.error || "#dc3545",
  },
  {
    id: "4",
    value: "awarded",
    label: "Awarded",
    icon: "trophy",
    description: "Completed and items assigned",
    getColor: () => colors.warning || "#ffc107",
  },
];

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  onChange,
  label = "Status",
}) => {
  const { colors } = useTheme();
  const filterModalRef = useRef<BottomSheetModal>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Adjusted snap points slightly for 4 options instead of 3
  const snapPoints = useMemo(() => ["50%", "65%"], []);
  const STATUS_OPTIONS = useMemo(() => getStatusOptions(colors), [colors]);
  const selectedStatus = useMemo(
    () => STATUS_OPTIONS.find((s) => s.value === value),
    [STATUS_OPTIONS, value],
  );

  const handleSelect = (statusValue: RxRfqStatusType) => {
    onChange(statusValue);
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
    setIsOpen(index !== -1);
  };

  const statusColor = selectedStatus?.getColor() || colors.backgroundElement;

  return (
    <View className="w-full gap-2">
      <Text className="text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: colors.text }}>{label}</Text>

      <TouchableOpacity
        className="flex-row items-center justify-between px-3 py-3 rounded-md border-[1.5px]"
        style={{ backgroundColor: statusColor + "15", borderColor: statusColor }}
        onPress={toggleBottomSheet}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-2.5 flex-1">
          {selectedStatus && (
            <MaterialCommunityIcons
              name={selectedStatus.icon}
              size={18}
              color={statusColor}
            />
          )}
          <Text className="text-sm font-semibold" style={{ color: statusColor }}>
            {selectedStatus?.label}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={statusColor}
          style={isOpen ? { marginLeft: 8, transform: [{ rotate: "180deg" }] } : { marginLeft: 8 }}
        />
      </TouchableOpacity>

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
        <View className="pb-4 items-center">
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            Select Status
          </Text>
        </View>

        <FlatList
          data={STATUS_OPTIONS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const itemColor = item.getColor();
            const isSelected = value === item.value;
            return (
              <TouchableOpacity
                className="flex-row justify-between items-center px-4 py-4 border-b-[0.5px] gap-3"
                style={{
                  borderBottomColor: colors.border,
                  backgroundColor: isSelected ? itemColor + "10" : "transparent",
                }}
                onPress={() => handleSelect(item.value)}
                activeOpacity={0.6}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: itemColor + "20" }}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={itemColor}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold" style={{ color: itemColor }}>
                      {item.label}
                    </Text>
                    <Text
                      className="text-xs font-normal"
                      style={{ color: colors.textSecondary }}
                    >
                      {item.description}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={itemColor}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </BottomSheet>
    </View>
  );
};

export default StatusDropdown;

