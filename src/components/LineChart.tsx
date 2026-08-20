import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface Props {
  data: { date: string; value: number }[];
  color?: string;
  unit?: string;
}

/**
 * @description Gráfico de linha simples (SVG) reutilizável — extraído de duplicatas quase idênticas
 * que existiam separadamente em `stats.tsx` e `achievements.tsx`. Usa `useWindowDimensions()` (não
 * `Dimensions.get('window')` capturado uma vez no escopo do módulo) porque no alvo Web esse valor
 * pode estar zerado no momento do render, gerando `chartWidth` negativo e quebrando o `<Svg>`
 * (erro: "attribute width: A negative value is not valid") — bug real que já existia numa das duas
 * cópias antes desta extração.
 */
export default function LineChart({ data, color = COLORS.primary, unit = 'kg' }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartHeight = 150;
  const chartWidth = Math.max(windowWidth - 100, 0);
  const padding = 20;

  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values) * 1.05;
  const minValue = Math.min(...values) * 0.95;

  const getY = (val: number) => chartHeight - ((val - minValue) / (maxValue - minValue || 1)) * (chartHeight - padding * 2) - padding;
  // Com um único ponto, `index / (data.length - 1)` divide por zero — o fallback `|| 1` fazia o
  // ponto (e o rótulo de valor, ancorado nele) nascer colado na borda esquerda do `<Svg>` e ter a
  // metade do texto cortada (ex: "82.5kg" aparecendo como "2.5kg"). Com 1 ponto só, centraliza.
  const getX = (index: number) => (data.length <= 1 ? chartWidth / 2 : (index / (data.length - 1)) * (chartWidth - padding) + padding / 2);

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={chartWidth} height={chartHeight}>
        <Line x1="0" y1={getY(maxValue)} x2={chartWidth} y2={getY(maxValue)} stroke={COLORS.gray100} strokeDasharray="4 4" strokeWidth="1" />
        <Line x1="0" y1={getY(minValue)} x2={chartWidth} y2={getY(minValue)} stroke={COLORS.gray100} strokeDasharray="4 4" strokeWidth="1" />
        <Polyline points={points} fill="none" stroke={color} strokeWidth="3" />
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <Circle cx={getX(i)} cy={getY(d.value)} r="5" fill={COLORS.white} stroke={color} strokeWidth="2" />
            <SvgText x={getX(i)} y={getY(d.value) - 10} fill={COLORS.secondary} fontSize="10" fontWeight="bold" textAnchor="middle">{d.value}{unit}</SvgText>
            <SvgText x={getX(i)} y={chartHeight} fill={COLORS.gray400} fontSize="10" textAnchor="middle">{d.date}</SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}
