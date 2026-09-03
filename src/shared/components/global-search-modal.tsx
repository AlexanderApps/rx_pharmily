import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useGlobalSearchStore } from "@/shared/hooks/use-global-search";
import { SEARCH_COMMANDS, SearchCommand } from "@/shared/utils/command-registry";

const CATEGORY_ORDER: SearchCommand["category"][] = ["Create", "Admin", "Navigate"];

function matches(command: SearchCommand, query: string): boolean {
  const haystack = [command.label, ...(command.keywords ?? [])].join(" ").toLowerCase();
  return haystack.includes(query);
}

const GlobalSearchModal: React.FC = () => {
  const { colors } = useTheme();
  const isOpen = useGlobalSearchStore((state) => state.isOpen);
  const close = useGlobalSearchStore((state) => state.close);
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // Admin-only commands are filtered out of the searchable set entirely
  // for non-admins — not just hidden by category grouping — so an admin
  // action can never appear as a result for a regular user no matter
  // what they type.
  const visibleCommands = useMemo(
    () => SEARCH_COMMANDS.filter((c) => !c.adminOnly || isAdmin),
    [isAdmin],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? visibleCommands.filter((c) => matches(c, q)) : visibleCommands;
    return CATEGORY_ORDER.flatMap((category) => matched.filter((c) => c.category === category));
  }, [visibleCommands, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      // Autofocus needs a tick after the modal actually mounts.
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const select = (command: SearchCommand) => {
    close();
    router.push(command.route as any);
  };

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const target = results[activeIndex];
        if (target) select(target);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, activeIndex]);

  if (!isOpen) return null;

  let runningIndex = -1;

  return (
    <Pressable className="absolute inset-0 items-center bg-[rgba(0,0,0,0.4)] pt-[10vh] px-4 z-[1000]" onPress={close}>
      <Pressable
        className="w-full max-w-[560px] rounded-[14px] border overflow-hidden"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
        }}
        onPress={(e) => e.stopPropagation()}
      >
        <View className="flex-row items-center gap-2.5 px-4 h-[52px] border-b" style={{ borderBottomColor: colors.border }}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search or jump to..."
            placeholderTextColor={colors.textSecondary}
            className="flex-1 text-[15px] outline-none"
            style={{ color: colors.text }}
          />
          <View className="px-2 py-[3px] rounded-md border" style={{ borderColor: colors.border }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Esc</Text>
          </View>
        </View>

        <ScrollView className="max-h-[380px]" keyboardShouldPersistTaps="handled">
          {results.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, padding: 20, textAlign: "center" }}>
              No matches for "{query}".
            </Text>
          ) : (
            CATEGORY_ORDER.map((category) => {
              const items = results.filter((c) => c.category === category);
              if (items.length === 0) return null;
              return (
                <View key={category}>
                  <Text className="text-[10px] font-bold tracking-[0.6px] px-4 pt-3 pb-1.5" style={{ color: colors.textSecondary }}>
                    {category.toUpperCase()}
                  </Text>
                  {items.map((command) => {
                    runningIndex += 1;
                    const active = runningIndex === activeIndex;
                    return (
                      <Pressable
                        key={command.id}
                        onPress={() => select(command)}
                        className="flex-row items-center px-4 py-2.5 mx-1.5 rounded-lg"
                        style={{ backgroundColor: active ? colors.backgroundElement : "transparent" }}
                      >
                        <MaterialCommunityIcons
                          name={command.icon as any}
                          size={17}
                          color={active ? colors.primary : colors.textSecondary}
                        />
                        <Text style={{ color: colors.text, fontSize: 13, marginLeft: 10 }}>{command.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      </Pressable>
    </Pressable>
  );
};

export default GlobalSearchModal;

