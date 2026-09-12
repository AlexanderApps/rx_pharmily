import React, { useImperativeHandle, forwardRef, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BsScrollView as BottomSheetScrollView } from "@/shared/components/bs/bs-primitives";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import {
  PhoneVerificationEntityType,
  usePhoneVerificationStore,
} from "@/features/profile/hooks/use-phone-verification-data";

interface PhoneVerificationSheetProps {
  entityType: PhoneVerificationEntityType;
  entityId: string;
  phone: string;
  onVerified: () => void;
}

type Step = "confirm" | "code";

const PhoneVerificationSheet = forwardRef<BottomSheetModal, PhoneVerificationSheetProps>(
  ({ entityType, entityId, phone, onVerified }, ref) => {
    const { colors } = useTheme();
    const requestCode = usePhoneVerificationStore((state) => state.requestCode);
    const verifyCode = usePhoneVerificationStore((state) => state.verifyCode);
    const isRequesting = usePhoneVerificationStore((state) => state.isRequesting);
    const isVerifying = usePhoneVerificationStore((state) => state.isVerifying);
    const fetchMyProfile = useProfileStore((state) => state.fetchMyProfile);
    const fetchFacilities = useProfileStore((state) => state.fetchFacilities);
    const fetchOrganizations = useProfileStore((state) => state.fetchOrganizations);

    const [step, setStep] = useState<Step>("confirm");
    const [code, setCode] = useState("");
    const [devCode, setDevCode] = useState<string | undefined>(undefined);

    const resetState = () => {
      setStep("confirm");
      setCode("");
      setDevCode(undefined);
    };

    const handleSendCode = async () => {
      const result = await requestCode(entityType, entityId);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't send a verification code.");
        return;
      }
      toast.success("Verification code sent.");
      // Only ever set when the dummy verification provider is active —
      // see verification-provider.ts's DummyVerificationProvider.
      // Auto-filling here is what makes the dummy flow actually
      // testable from the app UI itself instead of requiring a dig
      // through server logs every time; this whole branch simply never
      // fires once a real provider (Prelude) is configured.
      if (result.devCode) {
        setDevCode(result.devCode);
        setCode(result.devCode);
      } else {
        setDevCode(undefined);
      }
      setStep("code");
    };

    const handleVerify = async () => {
      // Prelude's own code_size option documents a 4-8 digit range
      // (account-configurable in their Dashboard, not something this
      // app controls or can predict) — hardcoding "exactly 6" here
      // would reject a perfectly valid code whenever an account isn't
      // configured for 6. The dummy provider always generates 6, so
      // this range covers that case too.
      const trimmed = code.trim();
      if (trimmed.length < 4 || trimmed.length > 8) {
        toast.error("Enter the code sent to your phone.");
        return;
      }
      const result = await verifyCode(entityType, entityId, trimmed);
      if (!result.ok) {
        toast.error(result.error ?? "Incorrect code.");
        return;
      }
      toast.success("Phone number verified.");

      // The Edge Function writes phone_verified_at directly via its
      // service-role client, bypassing this store's own set() calls
      // entirely — without an explicit refetch here, the badge on
      // whichever profile screen opened this sheet would keep showing
      // "not verified" until the next full reload, even though the DB
      // is already correct. Handled once here rather than duplicated at
      // each of the 3 call sites, since this component already knows
      // entityType.
      if (entityType === "user") await fetchMyProfile();
      else if (entityType === "facility") await fetchFacilities();
      else await fetchOrganizations();

      onVerified();
    };

    return (
      <BottomSheet
        ref={ref}
        title="Verify Phone Number"
        snapPoints={["55%"]}
        showHandle
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        onChange={(index: number) => {
          if (index === -1) resetState();
        }}
        backgroundColor={colors.backgroundSecondary}
      >
        <BottomSheetScrollView keyboardShouldPersistTaps="handled">
          <View className="px-5 pt-5 pb-10 gap-5">
            {step === "confirm" ? (
              <>
                <View className="items-center gap-2 py-2">
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary + "18" }}
                  >
                    <MaterialCommunityIcons name="phone-check-outline" size={26} color={colors.primary} />
                  </View>
                  <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                    We'll send a code to
                  </Text>
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    {phone}
                  </Text>
                </View>
                <Pressable
                  onPress={handleSendCode}
                  disabled={isRequesting}
                  className="py-3.5 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary, opacity: isRequesting ? 0.7 : 1 }}
                >
                  <Text className="text-white text-[15px] font-semibold">
                    {isRequesting ? "Sending..." : "Send Code"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View className="items-center gap-2 py-2">
                  <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                    Enter the code sent to
                  </Text>
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    {phone}
                  </Text>
                  {Boolean(devCode) && (
                    <View
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg mt-1"
                      style={{ backgroundColor: colors.warning + "18" }}
                    >
                      <MaterialCommunityIcons name="flask-outline" size={13} color={colors.warning} />
                      <Text className="text-xs font-semibold" style={{ color: colors.warning }}>
                        Dev mode — no real SMS sent. Code pre-filled below.
                      </Text>
                    </View>
                  )}
                </View>
                <TextInput
                  value={code}
                  onChangeText={(value) => setCode(value.replace(/[^0-9]/g, "").slice(0, 8))}
                  keyboardType="number-pad"
                  maxLength={8}
                  placeholder="000000"
                  placeholderTextColor={colors.textSecondary}
                  className="border rounded-xl px-4 py-3.5 text-center text-2xl tracking-[8px]"
                  style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundElement }}
                />
                <Pressable
                  onPress={handleVerify}
                  disabled={isVerifying}
                  className="py-3.5 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary, opacity: isVerifying ? 0.7 : 1 }}
                >
                  <Text className="text-white text-[15px] font-semibold">
                    {isVerifying ? "Verifying..." : "Verify"}
                  </Text>
                </Pressable>
                <Pressable onPress={handleSendCode} disabled={isRequesting} className="items-center py-1">
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    Didn't get it? Resend code
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

export default PhoneVerificationSheet;
