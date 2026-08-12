import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface EmergencyBannerProps {
  // "inline" is the small persistent disclaimer shown above the Q&A list
  // and the ask form. "full" is the blocking message shown instead of the
  // form when someone selects the Overdose/Emergency category — this app's
  // async Q&A queue is never an appropriate place for an active emergency.
  variant?: "inline" | "full";
}

const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ variant = "inline" }) => {
  const { colors } = useTheme();

  if (variant === "full") {
    return (
      <View style={[styles.fullWrap, { backgroundColor: colors.error + "12", borderColor: colors.error }]}>
        <MaterialCommunityIcons name="alert-octagon-outline" size={28} color={colors.error} />
        <Text style={[styles.fullTitle, { color: colors.error }]}>
          This isn't the right place for an emergency
        </Text>
        <Text style={[styles.fullBody, { color: colors.text }]}>
          If you or someone else may have taken too much of a medication, or is showing signs of
          a bad reaction, don't wait for a reply here.
        </Text>
        <Text style={[styles.fullBody, { color: colors.text }]}>
          Call your local emergency number or your nearest poison control service right away, or
          go to the nearest emergency room.
        </Text>
        <Text style={[styles.fullFootnote, { color: colors.textSecondary }]}>
          Ask Your Pharmacist is for general medication questions answered over time — it isn't
          monitored in real time and can't respond fast enough for an active emergency.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.inlineWrap, { backgroundColor: colors.warning + "12" }]}>
      <MaterialCommunityIcons name="information-outline" size={15} color={colors.warning} />
      <Text style={[styles.inlineText, { color: colors.warning }]}>
        Not for emergencies. If this is urgent, call your local emergency number or go to the
        nearest emergency room instead of waiting for a reply here.
      </Text>
    </View>
  );
};

export default EmergencyBanner;

const styles = StyleSheet.create({
  inlineWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    padding: 12,
  },
  inlineText: { fontSize: 12, flex: 1, lineHeight: 17, fontWeight: "500" },
  fullWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    alignItems: "flex-start",
  },
  fullTitle: { fontSize: 16, fontWeight: "700" },
  fullBody: { fontSize: 14, lineHeight: 20 },
  fullFootnote: { fontSize: 12, lineHeight: 17, marginTop: 4 },
});
