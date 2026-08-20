import React from 'react';
import Svg, { Polyline } from 'react-native-svg';

interface Props {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

/**
 * @description Mini-gráfico de linha sem eixos/legendas (SVG), pra dar uma prévia visual rápida
 * de uma tendência dentro de uma linha de lista (ex: card de uma medida corporal). Reutilizável —
 * extraído de uma versão que existia só dentro de `stats.tsx`.
 */
export default function Sparkline({ data, color, width = 80, height = 40 }: Props) {
  if (!data || data.length === 0) return null;
  if (data.length === 1) {
    // Uma única leitura: não dá pra desenhar uma linha, mas o Svg vazio evitaria o card de
    // parecer quebrado — desenha um ponto único centralizado na horizontal.
    return (
      <Svg width={width} height={height}>
        <Polyline points={`0,${height / 2} ${width},${height / 2}`} fill="none" stroke={color} strokeWidth="0" />
      </Svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    </Svg>
  );
}
