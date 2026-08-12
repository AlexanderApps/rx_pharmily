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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Apply to {job?.title ?? "this job"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {job?.companyName}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.text }]}>
            Cover note (optional)
          </Text>
          <TextInput
            value={coverNote}
            onChangeText={setCoverNote}
            placeholder="Briefly introduce yourself and why you're a good fit..."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.textArea,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your application is sent immediately — you can't undo this.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="send-outline" size={17} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Application</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  },
);

ApplySheet.displayName = "ApplySheet";

export default ApplySheet;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  label: { fontSize: 13, fontWeight: "600" },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 11, flex: 1 },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
