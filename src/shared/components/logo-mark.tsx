import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { LOGO_MARK_SVG } from "@/shared/assets/logo-mark";

// react-native-svg's Android path parser (com.horcrux.svg.PathParser)
// receives attribute values without XML entities decoded first — so the
// &#xA; (encoded newline) the source SVG uses to format long `d` path
// data across multiple lines arrives as a literal "&#xA;" string inside
// the path, and the parser correctly rejects the unexpected "&" (path
// data has its own number/command grammar, not XML entities — those are
// supposed to be resolved before the path parser ever sees the string).
// A newline is just whitespace either way in SVG path-data grammar, so
// swapping it for a plain space changes nothing about how the path
// renders. Computed once here, not inside the component, since the
// source markup is a static constant.
const SANITIZED_LOGO_MARK_SVG = LOGO_MARK_SVG.replace(/&#xA;/g, " ");

interface LogoMarkProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// The one place the app's actual logo gets rendered from — every branding
// spot in the app should use this rather than a generic icon standing in
// for it. SvgXml scales the original 200x200 viewBox to whatever size is
// requested without any quality loss, unlike a rasterized PNG.
const LogoMark: React.FC<LogoMarkProps> = ({ size = 40, style }) => {
  return <SvgXml xml={SANITIZED_LOGO_MARK_SVG} width={size} height={size} style={style} />;
};

export default LogoMark;
