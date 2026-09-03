import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform, TextInput, Modal, Alert} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import SubmitButton from "@/shared/components/submit-button";

export default function SecurityScreen() {
  const { colors } = useTheme();
  const changePassword = useAuthStore((state) => state.changePassword);
  const signOutOtherSessions = useAuthStore((state) => state.signOutOtherSessions);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleTerminateSessions = async () => {
    const ok = await confirm({
      title: "Sign Out Everywhere",
      message: "Are you sure you want to sign out of all other active sessions and devices?",
      confirmLabel: "Sign Out",
      destructive: true,
    });
    if (!ok) return;
    const result = await signOutOtherSessions();
    toast[result.ok ? "success" : "error"](
      result.ok ? "Signed out of other sessions." : (result.error ?? "Couldn't sign out other sessions."),
    );
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing information", "Fill in all three fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match", "Double-check your new password.");
      return;
    }
    const result = await changePassword(currentPassword, newPassword);
    if (result.ok) {
      toast.success("Password updated.");
      closePasswordModal();
    } else {
      toast.error(result.error ?? "Couldn't update your password.");
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header Row */}
        <View className="flex-row items-center px-4 py-3">
          {Platform.OS !== "web" && (
          <Pressable
            onPress={() => router.back()}
            className="p-1 mr-3"
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </Pressable>
          )}
          <Text className="text-xl font-semibold" style={{ color: colors.text }}>
            Security Settings
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: Credentials Management */}
          <View className="mt-6">
            <Text
              className="text-[13px] font-semibold uppercase mb-2 ml-1 tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              Credentials
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Change Password Link */}
              <Pressable
                onPress={() => setPasswordModalOpen(true)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      Change Password
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Update your account password
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* SECTION 2: Session Management */}
          <View className="mt-6">
            <Text
              className="text-[13px] font-semibold uppercase mb-2 ml-1 tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              Active Sessions
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Force Sign-Out Action */}
              <Pressable
                onPress={handleTerminateSessions}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="logout-variant"
                    size={22}
                    color="#C5221F"
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-base mb-0.5 font-semibold"
                      style={{ color: "#C5221F" }}
                    >
                      Log Out Other Devices
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Disconnect active tokens on all web/mobile links
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Modal visible={passwordModalOpen} transparent animationType="fade">
          <View className="flex-1 bg-black/50 justify-center p-6">
            <View
              className="rounded-2xl p-[18px] gap-2.5"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                Change Password
              </Text>

              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                className="border rounded-[10px] px-3 py-2.5 text-sm"
                style={{ backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }}
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                className="border rounded-[10px] px-3 py-2.5 text-sm"
                style={{ backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                className="border rounded-[10px] px-3 py-2.5 text-sm"
                style={{ backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }}
              />

              <View className="flex-row gap-2.5 mt-1">
                <Pressable
                  onPress={closePasswordModal}
                  className="flex-1 py-2.5 rounded-[10px] items-center"
                  style={{ backgroundColor: colors.backgroundElement }}
                >
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    Cancel
                  </Text>
                </Pressable>
                <View className="flex-1">
                  <SubmitButton label="Update" onPress={handleChangePassword} />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}
