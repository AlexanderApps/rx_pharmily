import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

interface StatusDropdownProps {
  value: "closed" | "hidden" | "opened";
  onChange: (value: "closed" | "hidden" | "opened") => void;
  label?: string;
}

type StatusOption = {
  id: string;
  value: "closed" | "hidden" | "opened";
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  description: string;
  getColor: () => string;
};

const getStatusOptions = (colors: any): StatusOption[] => [
  {
    id: "1",
    value: "opened",
    label: "Opened",
    icon: "lock-open-variant",
    description: "Donation is active and visible",
    getColor: () => colors.success,
  },
  {
    id: "2",
    value: "hidden",
    label: "Hidden",
    icon: "eye-off",
    description: "Not visible to others",
    getColor: () => colors.warning,
  },
  {
    id: "3",
    value: "closed",
    label: "Closed",
    icon: "lock",
    description: "No longer accepting items",
    getColor: () => colors.error,
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

  const snapPoints = useMemo(() => ["45%", "60%"], []);
  const STATUS_OPTIONS = useMemo(() => getStatusOptions(colors), [colors]);
  const selectedStatus = useMemo(
    () => STATUS_OPTIONS.find((s) => s.value === value),
    [STATUS_OPTIONS, value],
  );

  const handleSelect = (statusValue: "closed" | "hidden" | "opened") => {
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

