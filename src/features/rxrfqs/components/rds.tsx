import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Share,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
// import { format as dateFormat } from "date-fns";
import { useTheme } from "@/shared/hooks/use-theme";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import {
  RxRfqItem,
  RxRfqMarketPlaceData,
} from "@/features/rxrfqs/types/rxrfqs.types";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Sub-components ───────────────────────────────────────────────────────────

export const SectionHeader = ({ title }: { title: string }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );
};

// export const InfoRow = ({
//   icon,
//   label,
//   value,
//   badge,
// }: {
//   icon: string;
//   label: string;
//   value: string;
//   badge?: { label: string; color: string };
// }) => {
//   const { colors } = useTheme();
//   return (
//     <View style={styles.infoRow}>
//       <View style={styles.infoRowLeft}>
//         <MaterialCommunityIcons
//           name={icon as any}
//           size={16}
//           color={colors.textSecondary}
//         />
//         <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
//           {label}
//         </Text>
//       </View>
//       <View style={styles.infoRowRight}>
//         <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
//         {badge && (
//           <View
//             style={[styles.infoBadge, { backgroundColor: badge.color + "18" }]}
//           >
//             <Text style={[styles.infoBadgeText, { color: badge.color }]}>
//               {badge.label}
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// };

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
  value: string | React.ReactNode; // Accepts string or custom component
  badge?: BadgeObject | React.ReactNode; // Accepts badge config or custom component
}) => {
  const { colors } = useTheme();

  // Helper function to check if the badge is a standard config object
  const isBadgeObject = (b: any): b is BadgeObject => {
    return b && typeof b === "object" && "label" in b && "color" in b;
  };

  return (
    <View style={styles.infoRow}>
      {/* Left Side: Icon and Label */}
      <View style={styles.infoRowLeft}>
        <MaterialCommunityIcons
          name={icon as any}
          size={16}
          color={colors.textSecondary}
        />
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>

      {/* Right Side: Value and Badge */}
      <View style={styles.infoRowRight}>
        {/* Render custom component if passed, otherwise fallback to standard Text */}
        {React.isValidElement(value) || typeof value === "function" ? (
          value
        ) : (
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {value}
          </Text>
        )}

        {/* Render Badge logic */}
        {badge && (
          <>
            {isBadgeObject(badge) ? (
              <View
                style={[
                  styles.infoBadge,
                  { backgroundColor: badge.color + "18" },
                ]}
              >
                <Text style={[styles.infoBadgeText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
            ) : (
              // If it's not a config object, render it directly as a React Node
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
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
};

// ─── FAB group ────────────────────────────────────────────────────────────────

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
    <View style={styles.fabGroup}>
      {/* Secondary actions */}
      <View style={styles.fabSecondary}>
        <Pressable
          onPress={onBookmark}
          style={[
            styles.fabIconBtn,
            {
              backgroundColor: isBookmarked
                ? colors.primary + "18"
                : colors.backgroundSecondary,
              borderColor: isBookmarked ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isBookmarked ? colors.primary : colors.textSecondary}
          />
        </Pressable>
        <Pressable
          onPress={onShare}
          style={[
            styles.fabIconBtn,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
        <Pressable
          onPress={onContact}
          style={[
            styles.fabIconBtn,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="phone-outline"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Primary CTA */}
      <Pressable
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.fabPrimary,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <MaterialCommunityIcons
          name="file-send-outline"
          size={18}
          color={colors.text}
          // color={colors.primaryText}
        />
        <Text style={[styles.fabPrimaryText, { color: colors.text }]}>
          Submit a quote
        </Text>
      </Pressable>
    </View>
  );
};

// ─── Product Item group ────────────────────────────────────────────────────────────────

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
    useCatalogStore((state) => state.getProduct(product.productId)?.name) ?? "Unknown product";
  const [commentExpanded, setCommentExpanded] = useState(false);

  return (
    <View>
      <View style={styles.productRow}>
        {/* Index */}
        <View
          style={[
            styles.productIndex,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Text
            style={[styles.productIndexText, { color: colors.textSecondary }]}
          >
            {index + 1}
          </Text>
        </View>

        {/* Meta */}
        <View style={styles.productMeta}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {productName}
          </Text>
          <Text style={[styles.productQty, { color: colors.textSecondary }]}>
            {product.quantity} {product.uom}
          </Text>

          {/* Indicators row */}
          <View style={styles.productIndicators}>
            {product.allowAlternatives && (
              <View
                style={[
                  styles.altBadge,
                  { backgroundColor: colors.info + "18" },
                ]}
              >
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={12}
                  color={colors.info}
                />
                <Text style={[styles.altBadgeText, { color: colors.info }]}>
                  Alternatives OK
                </Text>
              </View>
            )}
            {!!product.comment && (
              <Pressable
                onPress={() => setCommentExpanded((v) => !v)}
                style={[
                  styles.commentToggle,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <MaterialCommunityIcons
                  name="comment-text-outline"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.commentToggleText,
                    { color: colors.textSecondary },
                  ]}
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

          {/* Collapsible comment */}
          {commentExpanded && !!product.comment && (
            <View
              style={[styles.commentBlock, { borderLeftColor: colors.border }]}
            >
              <Text
                style={[
                  styles.commentBlockText,
                  { color: colors.textSecondary },
                ]}
              >
                {product.comment}
              </Text>
            </View>
          )}
        </View>
      </View>

      {!isLast && (
        <View
          style={[styles.productDivider, { backgroundColor: colors.border }]}
        />
      )}
    </View>
  );
};

// ─── Terms and Conditions ────────────────────────────────────────────────────────────────

const TERMS_COLLAPSE_THRESHOLD = 300; // chars before we offer collapse

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
        style={[styles.termsText, { color: colors.textSecondary }]}
        numberOfLines={expanded ? undefined : 4}
      >
        {termsOfService || "No terms specified."}
      </Text>

      {isLong && (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={[styles.termsToggle, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.termsToggleText, { color: colors.primary }]}>
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
            style={[styles.termsDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.commentRow}>
            <MaterialCommunityIcons
              name="comment-text-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={[styles.commentText, { color: colors.textSecondary }]}>
              {comment}
            </Text>
          </View>
        </>
      )}
    </Card>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  navbarMeta: {
    flex: 1,
  },
  navbarCode: {
    fontSize: 15,
    fontWeight: "500",
  },
  navbarTime: {
    fontSize: 12,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 18,
    fontWeight: "600",
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroLocation: {
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  urgentText: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  termsText: {
    fontSize: 14,
    lineHeight: 21,
    padding: 14,
  },
  termsDivider: {
    height: 0.5,
    marginHorizontal: 14,
  },
  commentRow: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
    alignItems: "flex-start",
  },
  commentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
  },
  productIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  productIndexText: {
    fontSize: 13,
    fontWeight: "500",
  },
  productMeta: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
  },
  productQty: {
    fontSize: 13,
  },
  productComment: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
  productDivider: {
    height: 0.5,
    marginLeft: 54,
  },
  fabGroup: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 32 : 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    pointerEvents: "box-none",
    gap: 10,
  },
  fabSecondary: {
    flexDirection: "row",
    gap: 8,
  },
  fabIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  fabPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fabPrimaryText: {
    fontSize: 15,
    fontWeight: "500",
  },

  productIndicators: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  altBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  altBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  commentToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  commentToggleText: {
    fontSize: 11,
    fontWeight: "500",
  },
  commentBlock: {
    marginTop: 8,
    borderLeftWidth: 2,
    paddingLeft: 10,
  },
  commentBlockText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  termsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  termsToggleText: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
