import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import { ThemedText } from "@/shared/components/themed-text";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";

type MenuLink = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color?: string;
  onPress: () => void;
};

interface AccountScreenProps {
  avatarUrl?: string | null;
}

export default function AccountScreen({ avatarUrl }: AccountScreenProps) {
  const { colors } = useTheme();
  const { user } = useProfileStore();
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const isAdmin = isAdminRole(profile?.accountRole);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  // Safe dynamic press highlights across platforms
  const activeBg = colors.text === "#ffffff" ? "active:bg-white/5" : "active:bg-black/3";

  const menuSections: { title: string; links: MenuLink[] }[] = [
    {
      title: "Profiles",
      links: [
        {
          id: "profiles",
          label: "My Profiles",
          icon: "card-account-details-outline",
          onPress: () => router.push("/profile"),
        },
      ],
    },
    {
      title: "System",
      links: isAdmin ? [
        {
          id: "admin",
          label: "Admin",
          icon: "shield-crown-outline",
          onPress: () => router.push("/admin"),
        },
      ] : [],
    },
    {
      title: "Activity & Settings",
      links: [
        {
          id: "history",
          label: "History",
          icon: "history",
          onPress: () => router.push("/history"),
        },
        {
          id: "settings",
          label: "Settings",
          icon: "cog-outline",
          onPress: () => router.push("/settings"),
        },
      ],
    },
    {
      title: "Help & Legal",
      links: [
        {
          id: "support",
          label: "Help & Support",
          icon: "help-circle-outline",
          onPress: () => {},
        },
        {
          id: "info",
          label: "Information & Terms",
          icon: "information-outline",
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header Bar */}
        <ThemedView 
          className="px-5 py-4 border-b"
          style={{ borderBottomColor: colors.backgroundSecondary }}
        >
          <ThemedText className="text-[24px] font-bold">
            Account
          </ThemedText>
          <ThemedText className="mt-1">
            Manage your history and settings
          </ThemedText>
        </ThemedView>

        {/* Scrollable Container */}
        <ScrollView 
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerClassName="px-4 pt-6 pb-10 gap-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <Pressable 
            onPress={() => router.push("/profile/user-profile")} 
            className="items-center py-6 rounded-[16px] w-full"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <View className="relative mb-3.5">
              {avatarUrl ? (
                <LoadingImage 
                  source={{ uri: avatarUrl }} 
                  style={{ width: 84, height: 84, borderRadius: 42 }} 
                />
              ) : (
                <View 
                  className="w-[84px] h-[84px] rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.backgroundElement }}
                >
                  <MaterialCommunityIcons name="account" size={44} color={colors.textSecondary} />
                </View>
              )}
              
              {/* Camera Edit Badge */}
              <Pressable 
                className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full justify-center items-center active:opacity-80"
                style={{ backgroundColor: colors.text }}
              >
                <MaterialCommunityIcons name="camera" size={14} color={colors.backgroundSecondary} />
              </Pressable>
            </View>
            
            <Text 
              className="text-[18px] font-bold mb-0.5" 
              style={{ color: colors.text }}
            >
              {user.fullName}
            </Text>
            
            <Text 
              className="text-[13px] font-medium" 
              style={{ color: colors.textSecondary }}
            >
              {user.email}
            </Text>
          </Pressable>

          {/* Menu Sections Grid */}
          {menuSections
            .filter((section) => section.links.length > 0)
            .map((section) => (
              <View key={section.title} className="gap-2">
                <Text 
                  className="text-[12px] font-semibold uppercase tracking-[0.6px] pl-1" 
                  style={{ color: colors.textSecondary }}
                >
                  {section.title}
                </Text>
                
                <View 
                  className="rounded-[16px] overflow-hidden"
                  style={{ backgroundColor: colors.backgroundSecondary }}
                >
                  {section.links.map((link, index) => {
                    const isLast = index === section.links.length - 1;
                    const itemTextColor = link.color || colors.text;
                    const iconColor = link.color || colors.textSecondary;
                    
                    return (
                      <Pressable
                        key={link.id}
                        onPress={link.onPress}
                        className={`flex-row items-center justify-between px-4 py-[15px] ${activeBg}`}
                        style={!isLast ? { borderBottomColor: colors.border, borderBottomWidth: 0.5 } : undefined}
                      >
                        <View className="flex-row items-center gap-3.5">
                          <MaterialCommunityIcons name={link.icon} size={22} color={iconColor} />
                          <Text 
                            className="text-[15px] font-medium" 
                            style={{ color: itemTextColor }}
                          >
                            {link.label}
                          </Text>
                        </View>
                        <MaterialCommunityIcons 
                          name="chevron-right" 
                          size={20} 
                          color={link.color ? link.color : colors.border} 
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

          {/* Log Out Button */}
          <Pressable 
            onPress={handleLogout} 
            className="flex-row items-center justify-center gap-2 rounded-[14px] border py-3.5 mx-5 mt-2"
            style={{ 
              backgroundColor: colors.backgroundSecondary, 
              borderColor: colors.error 
            }}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
            <Text 
              className="text-[14px] font-bold" 
              style={{ color: colors.error }}
            >
              Log Out
            </Text>
          </Pressable>

          {/* App Version Label */}
          <Text 
            className="text-[11px] text-center font-semibold mt-2" 
            style={{ color: colors.textSecondary }}
          >
            Version 1.0.4 (Production)
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
