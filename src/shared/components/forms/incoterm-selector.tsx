import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { BsFlatList as BottomSheetFlatList } from "@/shared/components/bs/bs-primitives";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "@/shared/components/bottom-sheet";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";

interface IncotermsDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export const IncotermsDropdown: React.FC<IncotermsDropdownProps> = ({
  value,
  onChange,
  label,
  error,
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { incotermOptions } = useRxRfqsStore();

  const filterModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ["80%"], []);

  const incotermList = useMemo(() => incotermOptions, []);

  const selectedOption = useMemo(
    () =>
      incotermList.find((option) => option.code === value) ?? incotermList[0],
    [value],
  );

  const toggleBottomSheet = () => {
    if (isOpen) {
      filterModalRef.current?.dismiss();
    } else {
      filterModalRef.current?.present();
    }
  };

  const closeSheet = () => {
    filterModalRef.current?.dismiss();
  };

  const handleSelect = (code: string) => {
    onChange(code);
    closeSheet();
  };

  const handleBottomSheetChange = (index: number) => {
    // index is -1 when the sheet is completely closed/dismissed
    setIsOpen(index !== -1);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {label}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.trigger,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: error ? colors.error : colors.border,
            },
          ]}
          onPress={toggleBottomSheet}
        >
          <View style={styles.triggerContent}>
            <MaterialCommunityIcons
              name={
                selectedOption?.code === ""
                  ? "file-cancel-outline"
                  : "truck-cargo-container"
              }
              size={18}
              color={
                selectedOption?.code === ""
                  ? colors.textSecondary
                  : colors.primary
              }
            />

            <Text
              numberOfLines={1}
              style={[
                styles.triggerText,
                {
                  color: colors.text,
                },
              ]}
            >
              {selectedOption?.label ?? "Select Incoterm"}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={error ? colors.error : colors.textSecondary}
            style={[styles.icon, isOpen && styles.iconRotated]}
          />
        </TouchableOpacity>

        {error && (
          <Text
            style={[
              styles.errorText,
              {
                color: colors.error,
              },
            ]}
          >
            {error}
          </Text>
        )}
      </View>

      <BottomSheet
        ref={filterModalRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        showHandle={true}
        cornerRadius={16}
        padding={20}
        onChange={handleBottomSheetChange}
        backgroundColor={colors.backgroundSecondary}
      >
        <View
          style={[
            styles.modalHeader,
            {
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={closeSheet} style={styles.closeButton}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text
              style={[
                styles.modalTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Select Shipping Incoterm
            </Text>

            <Text
              style={[
                styles.modalSubtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Determines delivery responsibility and risk transfer
            </Text>
          </View>
        </View>

        <BottomSheetFlatList
          data={incotermList}
          keyExtractor={(item) => item.code || "NONE"}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = value === item.code;

            return (
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
                          item.code === ""
                            ? colors.border
                            : `${colors.primary}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.codeBadgeText,
                        {
                          color:
                            item.code === ""
                              ? colors.textSecondary
                              : colors.primary,
                        },
                      ]}
                    >
                      {item.code || "NONE"}
                    </Text>
                  </View>

                  <View style={styles.optionTextContainer}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
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
            );
          }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
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

  icon: {
    marginLeft: 8,
  },
  iconRotated: {
    transform: [{ rotate: "180deg" }],
  },

  errorText: {
    fontSize: 12,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    paddingBottom: 40,
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
