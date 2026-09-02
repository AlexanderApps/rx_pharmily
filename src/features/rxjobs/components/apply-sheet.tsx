import React, { forwardRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { Job } from "@/features/rxjobs/types/rxjobs.types";

interface ApplySheetProps {
  job: Job | null;
  onSubmit: (coverNote: string) => void;
  onClose: () => void;
}

const ApplySheet = forwardRef<BottomSheetModal, ApplySheetProps>(
  ({ job, onSubmit, onClose }, ref) => {
    const { colors } = useTheme();
    const [coverNote, setCoverNote] = useState("");

    const handleBottomSheetChange = (index: number) => {
      if (index === -1) {
        setCoverNote("");
        onClose();
      }
    };

    const handleSubmit = () => {
      onSubmit(coverNote.trim());
      setCoverNote("");
    };

    return (
      <BottomSheet
        ref={ref}
        snapPoints={["65%"]}
        showHandle
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        onChange={handleBottomSheetChange}
        backgroundColor={colors.backgroundSecondary}
      >
        <View className="px-5 pb-3.5 gap-0.5" style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
          <Text className="text-base font-bold" style={{ color: colors.text }}>
            Apply to {job?.title ?? "this job"}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {job?.companyName}
          </Text>
        </View>

        <View className="px-5 pt-4 gap-2.5">
          <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
            Cover note (optional)
          </Text>
          <TextInput
            value={coverNote}
            onChangeText={setCoverNote}
            placeholder="Briefly introduce yourself and why you're a good fit..."
            placeholderTextColor={colors.textSecondary}
            className="min-h-[120px] border rounded-[10px] p-3 text-sm"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
            }}
            multiline
            textAlignVertical="top"
          />

          <View className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text className="text-[11px] flex-1" style={{ color: colors.textSecondary }}>
              Your application is sent immediately — you can't undo this.
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl mt-2"
            style={{ backgroundColor: colors.primary }}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="send-outline" size={17} color="#fff" />
            <Text className="text-white text-[15px] font-semibold">Submit Application</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  },
);

ApplySheet.displayName = "ApplySheet";

export default ApplySheet;

