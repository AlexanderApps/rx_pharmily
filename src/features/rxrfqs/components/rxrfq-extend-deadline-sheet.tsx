import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

interface RxRfqExtendDeadlineSheetProps {
  currentDeadline: Date;
  onClose: () => void;
  onConfirm: (newDeadline: Date) => void;
}

const PRESETS = [1, 3, 7, 14];

const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const RxRfqExtendDeadlineSheet = forwardRef<
  BottomSheetModal,
  RxRfqExtendDeadlineSheetProps
>(({ currentDeadline, onClose, onConfirm }, ref) => {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ["65%"], []);
  const [extraDays, setExtraDays] = useState(3);

  useEffect(() => {
    setExtraDays(3);
  }, [currentDeadline]);

  const newDeadline = useMemo(() => {
    const d = new Date(currentDeadline);
    d.setDate(d.getDate() + extraDays);
    return d;
  }, [currentDeadline, extraDays]);

  const handleBottomSheetChange = (index: number) => {
    if (index === -1) onClose();
  };

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      showHandle
      cornerRadius={20}
      padding={0}
      enablePanDownToClose
      onChange={handleBottomSheetChange}
      backgroundColor={colors.backgroundSecondary}
    >
      <View className="flex-row justify-between items-center px-5 py-4 border-b" style={{ borderBottomColor: colors.border }}>
        <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
          Extend Submission Deadline
        </Text>
        <TouchableOpacity
          onPress={() =>
            (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
          }
          className="p-1"
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View className="px-5 pt-5 pb-[30px] gap-4">
        <View
          className="rounded-[10px] border p-3 gap-0.5"
          style={{
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          }}
        >
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            Current deadline
          </Text>
          <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
            {fmtDate(currentDeadline)}
          </Text>
        </View>

        <Text className="text-sm font-semibold" style={{ color: colors.text }}>Extend by</Text>
        <View className="flex-row gap-2">
          {PRESETS.map((days) => {
            const selected = extraDays === days;
            return (
              <TouchableOpacity
                key={days}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: selected
                    ? colors.text
                    : colors.backgroundElement,
                  borderColor: selected ? colors.text : colors.border,
                }}
                onPress={() => setExtraDays(days)}
              >
                <Text
                  className="text-[13px] font-semibold"
                  style={{
                    color: selected
                      ? colors.backgroundSecondary
                      : colors.text,
                  }}
                >
                  +{days}d
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          className="flex-row items-center rounded-[10px] border overflow-hidden"
          style={{
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          }}
        >
          <TouchableOpacity
            className="px-[18px] py-3.5 items-center justify-center"
            onPress={() => setExtraDays((d) => Math.max(1, d - 1))}
          >
            <MaterialCommunityIcons
              name="minus"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {extraDays}
            </Text>
            <Text className="text-xs mt-px" style={{ color: colors.textSecondary }}>
              day{extraDays > 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            className="px-[18px] py-3.5 items-center justify-center"
            onPress={() => setExtraDays((d) => Math.min(90, d + 1))}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View
          className="flex-row items-center gap-2.5 rounded-[10px] border p-3"
          style={{
            backgroundColor: colors.info + "10",
            borderColor: colors.info + "30",
          }}
        >
          <MaterialCommunityIcons
            name="calendar-check-outline"
            size={18}
            color={colors.info}
          />
          <View style={{ flex: 1 }}>
            <Text className="text-[11px] font-semibold uppercase tracking-[0.4px]" style={{ color: colors.info }}>
              New deadline
            </Text>
            <Text className="text-[15px] font-semibold mt-0.5" style={{ color: colors.text }}>
              {fmtDate(newDeadline)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="rounded-[10px] py-3.5 items-center justify-center"
          style={{ backgroundColor: colors.text }}
          onPress={() => onConfirm(newDeadline)}
          activeOpacity={0.8}
        >
          <Text
            className="text-base font-semibold"
            style={{ color: colors.backgroundSecondary }}
          >
            Confirm Extension
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
});

export default RxRfqExtendDeadlineSheet;

