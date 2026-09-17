import React, { useState } from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { printOrExportPdf } from "@/shared/utils/pdf";
import { toast } from "@/shared/hooks/use-toast";
import { usePermissionsStore } from "@/features/auth/hooks/use-permissions";

interface PrintButtonProps {
  // Builds the HTML lazily so the (sometimes non-trivial) document assembly
  // only happens when the user actually taps the button.
  getHtml: () => string;
  fileName: string;
  label?: string;
  // "icon" renders a bare icon button (for a header), "full" renders a
  // labeled pill button (for inline placement in a screen body).
  variant?: "icon" | "full";
  // Defaults to true (the print.export gate applies) so every existing
  // caller — donations, MediScope, RxRFQ — is unaffected. RxVitals is
  // the one exception: printing your own vitals is expected to be
  // available to everyone, not just verified professionals, so that
  // screen alone passes false.
  requiresPermission?: boolean;
}

const PrintButton: React.FC<PrintButtonProps> = ({
  getHtml,
  fileName,
  label = "Print / Export PDF",
  variant = "full",
  requiresPermission = true,
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const hasPermission = usePermissionsStore((state) => state.hasPermission);

  const handlePress = async () => {
    if (loading) return;
    // Gated here, once, rather than in each of this button's callers —
    // every screen that renders PrintButton gets the check for free,
    // unless it opts out via requiresPermission={false}.
    if (requiresPermission && !hasPermission("print.export")) {
      toast.error("Printing and exporting requires a verified professional account.");
      return;
    }
    setLoading(true);
    try {
      await printOrExportPdf(getHtml(), fileName);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading}
        className="w-[34px] h-[34px] rounded-[10px] items-center justify-center active:opacity-70"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <MaterialCommunityIcons
            name="printer-outline"
            size={18}
            color={colors.text}
          />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      className="flex-row items-center justify-center gap-2 py-3 rounded-[10px] border active:opacity-70"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <MaterialCommunityIcons
          name="printer-outline"
          size={16}
          color={colors.text}
        />
      )}
      <Text
        className="text-[13px] font-semibold"
        style={{ color: colors.text }}
      >
        {loading ? "Preparing..." : label}
      </Text>
    </Pressable>
  );
};

export default PrintButton;