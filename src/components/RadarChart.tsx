import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/theme';

export interface RadarAxis {
  label: string;
  /** 0-100, já normalizado — este componente só desenha, não normaliza. */
  value: number;
}

interface Props {
  data: RadarAxis[];
  color?: string;
}

/**
 * @description Gráfico de radar (SVG) genérico e reutilizável — extraído de uma duplicata que
 * existia em `stats.tsx` (Equilíbrio Muscular / Simetria Corporal usavam a mesma implementação
 * colada duas vezes). Espera valores já normalizados na escala 0-100; quem monta os dados decide
 * a normalização (ex: relativa ao maior eixo).
 */
export default function RadarChart({ data, color = COLORS.primary }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const size = Math.max(windowWidth * 0.8, 0);
  const center = size / 2;
  const radius = Math.max((size - 100) / 2, 0);
  const angleStep = (Math.PI * 2) / (data.length || 1);

  if (!data || data.length === 0) return null;

  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + Math.cos(angle) * (radius * (value / 100));
    const y = center + Math.sin(angle) * (radius * (value / 100));
    return { x, y };
  };

  const dataPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(d.value, i);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [33, 66, 100].map((level) =>
    data.map((_, i) => {
      const { x, y } = getCoordinates(level, i);
      return `${x},${y}`;
    }).join(' ')
  );

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={size} height={size}>
        {gridLevels.map((points, i) => (
          <Polygon key={i} points={points} stroke={COLORS.gray200} strokeWidth="1" fill="none" />
        ))}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke={COLORS.gray200} strokeWidth="1" />;
        })}
        <Polygon points={dataPoints} fill={`${color}33`} stroke={color} strokeWidth="2" />
        {data.map((d, i) => {
          const { x, y } = getCoordinates(d.value, i);
          return <Circle key={i} cx={x} cy={y} r="4" fill={color} />;
        })}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(122, i);
          return (
            <SvgText
              key={i}
              x={x}
              y={y}
              fontSize="10"
              fontWeight="bold"
              fill={COLORS.gray500}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
