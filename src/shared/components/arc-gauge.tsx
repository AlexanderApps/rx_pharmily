import React from "react";
import { View, Text, StyleSheet } from "react-native";
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
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
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

      <View style={styles.centerContent}>
        <Text
          style={[
            styles.label,
            {
              color: textColor,
            },
          ]}
        >
          {label}
        </Text>

        {sublabel ? (
          <Text
            style={[
              styles.sublabel,
              {
                color: subtextColor,
              },
            ]}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default ArcGauge;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  sublabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
});