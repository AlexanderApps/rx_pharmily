import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

export interface RadialGaugeProps {
  pct: number;
  size: number;
  stroke: number;
  color: string;
  trackColor: string;
  label: string;
  sublabel?: string;
  textColor: string;
  subtextColor: string;
  useGradient?: boolean;
  gradientColors?: [string, string];
}

const ArcGauge: React.FC<RadialGaugeProps> = ({
  pct,
  size,
  stroke,
  color,
  trackColor,
  label,
  sublabel,
  textColor,
  subtextColor,
  useGradient = false,
  gradientColors,
}) => {
  const percentage = Math.max(0, Math.min(100, pct));

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (percentage / 100) * circumference;

  const gradientId = `gaugeGradient-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {useGradient && gradientColors && (
          <Defs>
            <LinearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
        )}

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="transparent"
        />

        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={
            useGradient && gradientColors
              ? `url(#${gradientId})`
              : color
          }
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View className="absolute items-center justify-center">
        <Text className="text-base font-bold" style={{ color: textColor }}>
          {label}
        </Text>

        {sublabel ? (
          <Text className="text-[11px] mt-0.5 text-center" style={{ color: subtextColor }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default ArcGauge;
