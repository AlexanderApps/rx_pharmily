import React, { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  Share,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import {
  RxRfqItem,
  RxRfqMarketPlaceData,
} from "@/features/rxrfqs/types/rxrfqs.types";
import { SafeAreaView } from "react-native-safe-area-context";

export const SectionHeader = ({ title }: { title: string }) => {
  const { colors } = useTheme();
  return (
    <Text
      className="mb-2 mt-5 text-xs font-medium uppercase tracking-wider"
      style={{ color: colors.textSecondary }}
    >
      {title}
    </Text>
  );
};

interface BadgeObject {
  label: string;
  color: string;
}

export const InfoRow = ({
  icon,
  label,
  value,
  badge,
}: {
  icon: string;
  label: string;
  value: string | React.ReactNode;
  badge?: BadgeObject | React.ReactNode;
}) => {
  const { colors } = useTheme();

  const isBadgeObject = (b: any): b is BadgeObject => {
    return b && typeof b === "object" && "label" in b && "color" in b;
  };

  return (
    <View className="flex-row items-center justify-between border-t border-black/5 px-3.5 py-2.5">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons
          name={icon as any}
          size={16}
          color={colors.textSecondary}
        />
        <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {React.isValidElement(value) || typeof value === "function" ? (
          value
        ) : (
          <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
            {value}
          </Text>
        )}

        {badge && (
          <>
            {isBadgeObject(badge) ? (
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: badge.color + "18" }}
              >
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: badge.color }}
                >
                  {badge.label}
                </Text>
              </View>
            ) : (
              badge
            )}
          </>
        )}
      </View>
    </View>
  );
};

export const Card = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View
      className="overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        borderWidth: 0.5,
      }}
    >
      {children}
    </View>
  );
};

interface FabGroupProps {
  isBookmarked: boolean;
  onSubmit: () => void;
  onContact: () => void;
  onShare: () => void;
  onBookmark: () => void;
}

export const FabGroup = ({
  isBookmarked,
  onSubmit,
  onContact,
  onShare,
  onBookmark,
}: FabGroupProps) => {
  const { colors } = useTheme();

  return (
    <View
      className="absolute left-4 right-4 flex-row items-center gap-2.5"
      style={{ bottom: Platform.OS === "ios" ? 32 : 24 }}
      pointerEvents="box-none"
    >
      <View className="flex-row gap-2">
        <Pressable
          onPress={onBookmark}
          className="h-11 w-11 items-center justify-center rounded-[14px] border active:opacity-80"
          style={{
            backgroundColor: isBookmarked
              ? colors.primary + "18"
              : colors.backgroundSecondary,
            borderColor: isBookmarked ? colors.primary : colors.border,
            borderWidth: 0.5,
          }}
        >
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isBookmarked ? colors.primary : colors.textSecondary}
          />
        </Pressable>

        <Pressable
          onPress={onShare}
          className="h-11 w-11 items-center justify-center rounded-[14px] border active:opacity-80"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={onContact}
          className="h-11 w-11 items-center justify-center rounded-[14px] border active:opacity-80"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <MaterialCommunityIcons
            name="phone-outline"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      <Pressable
        onPress={onSubmit}
        className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-[14px] active:opacity-85"
        style={{ backgroundColor: colors.primary }}
      >
        <MaterialCommunityIcons
          name="file-send-outline"
          size={18}
          color={colors.text}
        />
        <Text className="text-[15px] font-medium" style={{ color: colors.text }}>
          Submit a quote
        </Text>
      </Pressable>
    </View>
  );
};

export const ProductItem = ({
  product,
  index,
  isLast,
}: {
  product: RxRfqItem;
  index: number;
  isLast: boolean;
}) => {
  const { colors } = useTheme();
  const productName =
    useCatalogStore((state) => state.getProduct(product.productId)?.name) ??
    "Unknown product";
  const [commentExpanded, setCommentExpanded] = useState(false);

  return (
    <View>
      <View className="flex-row items-start gap-3 p-3">
        <View
          className="h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Text
            className="text-[13px] font-medium"
            style={{ color: colors.textSecondary }}
          >
            {index + 1}
          </Text>
        </View>

        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            {productName}
          </Text>
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            {product.quantity} {product.uom}
          </Text>

          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            {product.allowAlternatives && (
              <View
                className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.info + "18" }}
              >
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={12}
                  color={colors.info}
                />
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: colors.info }}
                >
                  Alternatives OK
                </Text>
              </View>
            )}

            {!!product.comment && (
              <Pressable
                onPress={() => setCommentExpanded((v) => !v)}
                className="flex-row items-center gap-1 rounded-full px-2 py-0.5 active:opacity-80"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <MaterialCommunityIcons
                  name="comment-text-outline"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Note
                </Text>
                <Ionicons
                  name={commentExpanded ? "chevron-up" : "chevron-down"}
                  size={11}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          {commentExpanded && !!product.comment && (
            <View
              className="mt-2 border-l-2 pl-2.5"
              style={{ borderLeftColor: colors.border }}
            >
              <Text
                className="text-[13px] italic leading-[19px]"
                style={{ color: colors.textSecondary }}
              >
                {product.comment}
              </Text>
            </View>
          )}
        </View>
      </View>

      {!isLast && (
        <View
          className="ml-[54px] h-px"
          style={{ backgroundColor: colors.border }}
        />
      )}
    </View>
  );
};

const TERMS_COLLAPSE_THRESHOLD = 300;

export const TermsCard = ({
  termsOfService,
  comment,
}: {
  termsOfService: string;
  comment?: string;
}) => {
  const { colors } = useTheme();
  const isLong = termsOfService.length > TERMS_COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(true);

  return (
    <Card>
      <Text
        className="p-3.5 text-sm leading-[21px]"
        style={{ color: colors.textSecondary }}
        numberOfLines={expanded ? undefined : 4}
      >
        {termsOfService || "No terms specified."}
      </Text>

      {isLong && (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          className="flex-row items-center justify-center gap-1 border-t py-2.5 active:opacity-80"
          style={{ borderTopColor: colors.border, borderTopWidth: 0.5 }}
        >
          <Text className="text-[13px] font-medium" style={{ color: colors.primary }}>
            {expanded ? "Show less" : "Show more"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.primary}
          />
        </Pressable>
      )}

      {comment && (
        <>
          <View
            className="mx-3.5 h-px"
            style={{ backgroundColor: colors.border }}
          />
          <View className="flex-row items-start gap-2 p-3.5">
            <MaterialCommunityIcons
              name="comment-text-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text
              className="flex-1 text-[13px] leading-[19px]"
              style={{ color: colors.textSecondary }}
            >
              {comment}
            </Text>
          </View>
        </>
      )}
    </Card>
  );
};