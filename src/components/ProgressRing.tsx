import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size: number;
  /** 0 a 1 — fração já preenchida do anel. */
  progress: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/**
 * @description Anel de progresso circular animado (SVG), usado em qualquer indicador do tipo
 * "X de Y" — calorias, água, etc. Centraliza a lógica que antes existia duplicada em
 * `DietScreen` (CalorieRing) e `WaterModal` (WaterRing).
 */
export default function ProgressRing({ size, progress, strokeWidth = 8, color, trackColor = COLORS.gray100, children }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safeProgress = Math.min(Math.max(progress, 0), 1);
    Animated.timing(animatedProgress, { toValue: safeProgress, duration: 800, easing: Easing.out(Easing.exp), useNativeDriver: false }).start();
  }, [progress]);

  const strokeDashoffset = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle stroke={trackColor} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          stroke={color}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children && <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>{children}</View>}
    </View>
  );
}
