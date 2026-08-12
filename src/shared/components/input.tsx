import React, { useState, useRef } from "react";
import {
  TextInput,
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
  TextInputProps,
  TextInputFocusEventData,
  TextInputSubmitEditingEventData,
} from "react-native";

import type { FocusEvent } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedText } from "@/shared/components/themed-text";

interface InputProps {
  // Core
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;

  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;

  // Styling
  variant?: "flat" | "outline" | "underline" | "filled";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;

  // Colors
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
  borderColor?: string;
  focusedBorderColor?: string;

  // Customization
  borderRadius?: number;
  padding?: number;
  borderWidth?: number;
  focusedBorderWidth?: number;

  // Behavior
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  maxLength?: number;
  editable?: boolean;
  selectTextOnFocus?: boolean;

  // Callbacks
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;

  onSubmitEditing?: (e: {
    nativeEvent: TextInputSubmitEditingEventData;
  }) => void;

  returnKeyType?: TextInputProps["returnKeyType"];

  // Styling props
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      placeholder = "Enter text...",
      value,
      onChangeText,
      leftIcon,
      rightIcon,
      onLeftIconPress,
      onRightIconPress,
      variant = "flat",
      size = "medium",
      disabled = false,
      error = false,
      errorMessage,
      backgroundColor,
      textColor,
      placeholderColor,
      borderColor,
      focusedBorderColor,
      borderRadius,
      padding,
      borderWidth,
      focusedBorderWidth,
      multiline = false,
      numberOfLines = 1,
      secureTextEntry = false,
      keyboardType = "default",
      maxLength,
      editable = true,
      selectTextOnFocus = false,
      onFocus,
      onBlur,
      onSubmitEditing,
      returnKeyType = "done",
      style,
      containerStyle,
      inputContainerStyle,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    const [isFocused, setIsFocused] = useState(false);

    const focusAnimValue = useRef(new Animated.Value(0)).current;

    // Size configurations
    const sizeConfigs = {
      small: {
        height: 36,
        fontSize: 13,
        paddingVertical: 8,
        paddingHorizontal: 10,
      },
      medium: {
        height: 44,
        fontSize: 15,
        paddingVertical: 10,
        paddingHorizontal: 12,
      },
      large: {
        height: 52,
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
      },
    };

    const currentSize = sizeConfigs[size];

    // Colors
    const defaultBg =
      variant === "filled"
        ? colors.backgroundSelected
        : colors.backgroundElement;

    const defaultBorder = error ? colors.error : colors.border;

    const defaultFocusedBorder = error
      ? colors.error
      : colors.backgroundElement;

    const defaultTextColor = disabled ? colors.textSecondary : colors.text;

    const defaultPlaceholder = colors.textSecondary;

    const bgColor = backgroundColor || defaultBg;

    const txtColor = textColor || defaultTextColor;

    const placeholderTxtColor = placeholderColor || defaultPlaceholder;

    const brColor = borderColor || defaultBorder;

    const focusedBrColor = focusedBorderColor || defaultFocusedBorder;

    // Focus Handlers
    const handleFocus = (e: FocusEvent) => {
      setIsFocused(true);

      Animated.timing(focusAnimValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();

      onFocus?.(e);
    };

    const handleBlur = (e: FocusEvent) => {
      setIsFocused(false);

      Animated.timing(focusAnimValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();

      onBlur?.(e);
    };

    // Animated border color
    const animatedBorderColor = focusAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [brColor, focusedBrColor],
    });

    // Variant styles
    const getVariantStyles = () => {
      switch (variant) {
        case "outline":
          return {
            borderWidth: isFocused
              ? (focusedBorderWidth ?? 2)
              : (borderWidth ?? 1.5),
            borderRadius: borderRadius ?? 12,
          };

        case "underline":
          return {
            borderBottomWidth: isFocused
              ? (focusedBorderWidth ?? 2)
              : (borderWidth ?? 1),
            borderRadius: 0,
          };

        case "filled":
          return {
            borderWidth: borderWidth ?? 0,
            borderRadius: borderRadius ?? 12,
          };

        case "flat":
        default:
          return {
            borderWidth: borderWidth ?? 0,
            borderRadius: borderRadius ?? 0,
          };
      }
    };

    const variantStyles = getVariantStyles();

    return (
      <View style={containerStyle}>
        {/* Input Container */}
        <Animated.View
          style={[
            {
              height: multiline ? undefined : currentSize.height,

              paddingHorizontal: padding ?? currentSize.paddingHorizontal,

              paddingVertical: multiline
                ? (padding ?? currentSize.paddingVertical)
                : 0,

              flexDirection: "row",

              alignItems: multiline ? "flex-start" : "center",

              opacity: disabled ? 0.5 : 1,

              backgroundColor: bgColor,

              borderColor:
                variant === "filled" || variant === "flat"
                  ? "transparent"
                  : animatedBorderColor,
            },
            variantStyles,
            inputContainerStyle,
          ]}
        >
          {/* Left Icon */}
          {leftIcon && (
            <TouchableOpacity
              onPress={onLeftIconPress}
              disabled={!onLeftIconPress}
              activeOpacity={0.6}
              style={{
                paddingRight: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {leftIcon}
            </TouchableOpacity>
          )}

          {/* Input */}
          <TextInput
            ref={ref}
            placeholder={placeholder}
            placeholderTextColor={placeholderTxtColor}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={onSubmitEditing}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            maxLength={maxLength}
            editable={editable && !disabled}
            selectTextOnFocus={selectTextOnFocus}
            returnKeyType={returnKeyType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            style={[
              {
                flex: 1,
                fontSize: currentSize.fontSize,
                color: txtColor,
                padding: 0,
                margin: 0,
                textAlignVertical: multiline ? "top" : "center",
              },
              style,
            ]}
          />

          {/* Right Icon */}
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              activeOpacity={0.6}
              style={{
                paddingLeft: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Error */}
        {error && errorMessage && (
          <View
            style={{
              marginTop: 4,
            }}
          >
            <ThemedText>{errorMessage}</ThemedText>
          </View>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";

export default Input;
