import React from "react";
import { View, Text } from "react-native";
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
      <View className="rounded-2xl border p-5 gap-2.5 items-start" style={{ backgroundColor: colors.error + "12", borderColor: colors.error }}>
        <MaterialCommunityIcons name="alert-octagon-outline" size={28} color={colors.error} />
        <Text className="text-base font-bold" style={{ color: colors.error }}>
          This isn't the right place for an emergency
        </Text>
        <Text className="text-sm leading-5" style={{ color: colors.text }}>
          If you or someone else may have taken too much of a medication, or is showing signs of
          a bad reaction, don't wait for a reply here.
        </Text>
        <Text className="text-sm leading-5" style={{ color: colors.text }}>
          Call your local emergency number or your nearest poison control service right away, or
          go to the nearest emergency room.
        </Text>
        <Text className="text-xs leading-[17px] mt-1" style={{ color: colors.textSecondary }}>
          Ask Your Pharmacist is for general medication questions answered over time — it isn't
          monitored in real time and can't respond fast enough for an active emergency.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-start gap-2 rounded-[10px] p-3" style={{ backgroundColor: colors.warning + "12" }}>
      <MaterialCommunityIcons name="information-outline" size={15} color={colors.warning} />
      <Text className="text-xs flex-1 leading-[17px] font-medium" style={{ color: colors.warning }}>
        Not for emergencies. If this is urgent, call your local emergency number or go to the
        nearest emergency room instead of waiting for a reply here.
      </Text>
    </View>
  );
};

export default EmergencyBanner;

