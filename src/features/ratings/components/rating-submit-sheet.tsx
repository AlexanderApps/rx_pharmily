import React, { forwardRef, useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { toast } from "@/shared/hooks/use-toast";
import { useRatingsStore } from "@/features/ratings/hooks/use-ratings-data";
import { Rating, RatingEntityType } from "@/features/ratings/types/ratings.types";

interface RatingSubmitSheetProps {
  entityType: RatingEntityType;
  entityId: string;
  entityLabel: string; // e.g. a facility or user's name, for the sheet's subtitle
  // The rater's own existing rating for this entity, if any — pre-fills
  // the sheet as an edit rather than a fresh submission. Passed in
  // rather than looked up internally so the caller controls exactly
  // when it's current (re-fetching ratings is the caller's job).
  existingRating?: Rating;
  onSubmitted: () => void;
}

const RatingSubmitSheet = forwardRef<BottomSheetModal, RatingSubmitSheetProps>(
  ({ entityType, entityId, entityLabel, existingRating, onSubmitted }, ref) => {
    const { colors } = useTheme();
    const submitRating = useRatingsStore((state) => state.submitRating);
    const [score, setScore] = useState(existingRating?.score ?? 0);
    const [comment, setComment] = useState(existingRating?.comment ?? "");
    const [submitting, setSubmitting] = useState(false);

    // Re-sync whenever a different existing rating is passed in (e.g.
    // the sheet is reused across entities without unmounting).
    useEffect(() => {
      setScore(existingRating?.score ?? 0);
      setComment(existingRating?.comment ?? "");
    }, [existingRating]);

    const handleSubmit = async () => {
      if (score < 1) {
        toast.error("Pick a star rating first.");
        return;
      }
      setSubmitting(true);
      const ok = await submitRating(entityType, entityId, score, comment);
      setSubmitting(false);
      if (!ok) {
        toast.error("Couldn't submit your rating. Please try again.");
        return;
      }
      toast.success(existingRating ? "Rating updated." : "Rating submitted.");
      onSubmitted();
    };

    return (
      <BottomSheet
        ref={ref}
        title={existingRating ? "Edit Your Rating" : "Rate This"}
        subtitle={entityLabel}
        snapPoints={["50%"]}
        showHandle
        cornerRadius={20}
        enablePanDownToClose
        backgroundColor={colors.backgroundSecondary}
      >
        <View className="px-4 pb-6 pt-2 gap-4">
          <View className="flex-row justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setScore(value)} hitSlop={6}>
                <MaterialCommunityIcons
                  name={value <= score ? "star" : "star-outline"}
                  size={36}
                  color={value <= score ? colors.warning : colors.textSecondary}
                />
              </Pressable>
            ))}
          </View>

          <View>
            <Text className="text-xs font-semibold mb-1.5" style={{ color: colors.text }}>
              Comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share more about your experience..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.backgroundElement,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className="py-3.5 rounded-xl items-center"
            style={{ backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white text-[15px] font-semibold">
                {existingRating ? "Update Rating" : "Submit Rating"}
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheet>
    );
  },
);

export default RatingSubmitSheet;
