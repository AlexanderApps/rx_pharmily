import { Platform, Text, type TextProps } from "react-native";

import { Fonts, ThemeColor } from "@/shared/constants/theme";
import { useTheme } from "@/shared/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "small"
    | "smallBold"
    | "subtitle"
    | "link"
    | "linkPrimary"
    | "code";
  themeColor?: ThemeColor;
};

// Every variant below except "code" is currently an empty placeholder —
// no properties defined yet, just documenting the intended className
// for whenever each is actually filled in. Add classes directly to the
// relevant line below rather than reintroducing a StyleSheet object.
const TYPE_CLASSNAMES: Record<string, string> = {
  small: "", // fontSize: 14, lineHeight: 20, fontWeight: 500
  smallBold: "", // fontSize: 14, lineHeight: 20, fontWeight: 700
  default: "", // fontSize: 16, lineHeight: 24, fontWeight: 500
  title: "", // fontSize: 48, fontWeight: 600, lineHeight: 52
  subtitle: "", // fontSize: 32, lineHeight: 44, fontWeight: 600
  link: "", // lineHeight: 30, fontSize: 14
  linkPrimary: "", // lineHeight: 30, fontSize: 14, color: '#3c87f7'
};

export function ThemedText({
  style,
  type = "default",
  themeColor,
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();

  return (
    <Text
      className={TYPE_CLASSNAMES[type] ?? ""}
      style={[
        { color: colors[themeColor ?? "text"] },
        type === "code" && {
          fontFamily: Fonts.mono,
          fontWeight: Platform.select({ android: 700 }) ?? 500,
          fontSize: 12,
        },
        style,
      ]}
      {...rest}
    />
  );
}

