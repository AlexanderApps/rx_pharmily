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
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: statusColor + "15",
            borderColor: statusColor,
          },
        ]}
        onPress={toggleBottomSheet}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          {selectedStatus && (
            <MaterialCommunityIcons
              name={selectedStatus.icon}
              size={18}
              color={statusColor}
            />
          )}
          <Text style={[styles.buttonText, { color: statusColor }]}>
            {selectedStatus?.label}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={statusColor}
          style={[styles.icon, isOpen && styles.iconRotated]}
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
        <View style={styles.bottomSheetHeader}>
          <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
            Select Status
          </Text>
        </View>

        <FlatList
          data={STATUS_OPTIONS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const itemColor = item.getColor();
            const isSelected = value === item.value;
            return (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  { borderBottomColor: colors.border },
                  isSelected && { backgroundColor: itemColor + "10" },
                ]}
                onPress={() => handleSelect(item.value)}
                activeOpacity={0.6}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: itemColor + "20" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={itemColor}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.optionLabel, { color: itemColor }]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.textSecondary },
                      ]}
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

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  icon: {
    marginLeft: 8,
  },
  iconRotated: {
    transform: [{ rotate: "180deg" }],
  },
  bottomSheetHeader: {
    paddingBottom: 16,
    alignItems: "center",
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 24,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 12,
    fontWeight: "400",
  },
});

export default StatusDropdown;
