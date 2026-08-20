import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../constants/theme';
import STRINGS from '../../../constants/strings.json';
import { WorkoutService } from '../../workout/services/WorkoutService';
import { BodyMetricsService, MetricKey, MetricPoint } from '../services/BodyMetricsService';
import { formatShortDatePt, toISODate } from '../utils';

const HEATMAP_DAYS = 98; // 14 semanas (7 dias x 14 colunas), ~3 meses — mesma janela do texto do modal de Consistência.

export interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  icon: string;
  color: string;
}

/** @description As 5 métricas de "Evolução Corporal" (bioimpedância), na ordem em que aparecem na aba Corpo. */
export const BODY_METRICS: MetricConfig[] = [
  { key: 'weight_kg', label: STRINGS.stats.body.metrics.weight_kg, unit: 'kg', icon: 'scale-bathroom', color: COLORS.info },
  { key: 'body_fat_pct', label: STRINGS.stats.body.metrics.body_fat_pct, unit: '%', icon: 'water-percent', color: COLORS.accent },
  { key: 'muscle_mass_kg', label: STRINGS.stats.body.metrics.muscle_mass_kg, unit: 'kg', icon: 'arm-flex', color: COLORS.error },
  { key: 'water_pct', label: STRINGS.stats.body.metrics.water_pct, unit: '%', icon: 'water', color: COLORS.info },
  { key: 'bone_mass_kg', label: STRINGS.stats.body.metrics.bone_mass_kg, unit: 'kg', icon: 'bone', color: COLORS.gray500 },
];

/** @description As 5 métricas de "Medidas" (circunferências), na ordem em que aparecem na aba Medidas. */
export const MEASURE_METRICS: MetricConfig[] = [
  { key: 'biceps_cm', label: STRINGS.stats.measures.measureNames.biceps_cm, unit: 'cm', icon: 'arm-flex-outline', color: COLORS.primary },
  { key: 'chest_cm', label: STRINGS.stats.measures.measureNames.chest_cm, unit: 'cm', icon: 'human', color: COLORS.primary },
  { key: 'waist_cm', label: STRINGS.stats.measures.measureNames.waist_cm, unit: 'cm', icon: 'tape-measure', color: COLORS.primary },
  { key: 'thigh_cm', label: STRINGS.stats.measures.measureNames.thigh_cm, unit: 'cm', icon: 'human-handsdown', color: COLORS.primary },
  { key: 'calf_cm', label: STRINGS.stats.measures.measureNames.calf_cm, unit: 'cm', icon: 'shoe-print', color: COLORS.primary },
];

// Agrupa os `body_part_pt` reais do catálogo (`ExerciseLibrary`, ver src/data/exercises.json) nos
// 6 eixos fixos do radar de Equilíbrio Muscular. "Cardio" e "Pescoço" ficam de fora de propósito —
// não são grupos de força comparáveis aos outros 6 eixos.
const MUSCLE_AXIS_MAP: Record<string, string> = {
  'Peito': 'Peito',
  'Costas': 'Costas',
  'Pernas (Superior)': 'Pernas',
  'Pernas (Inferior)': 'Pernas',
  'Ombros': 'Ombros',
  'Braços (Superior)': 'Braços',
  'Braços (Inferior)': 'Braços',
  'Abdômen': 'Abdômen',
};
const MUSCLE_AXES = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen'];

export interface RadarAxis { label: string; value: number; }
export interface VolumeWeek { label: string; volumeKg: number; isCurrent: boolean; }
export interface HeatmapDay { date: string; level: 0 | 1 | 2 | 3; }

export interface PerformanceStats {
  weeklyVolume: VolumeWeek[];
  volumeDeltaPct: number | null;
  muscleRadar: RadarAxis[];
  weakestMuscleAxis: string | null;
  heatmap: HeatmapDay[];
  heatmapTrainedPct: number;
}

/**
 * @description Busca `getMonthHistory` de todos os meses cobertos pelos últimos `HEATMAP_DAYS`
 * dias e junta num único mapa `date -> {status, volumeKg}`, pronto pra virar o heatmap de
 * Consistência sem repetir chamadas por dia.
 */
const fetchHeatmapSource = async (): Promise<Record<string, { status: string; volumeKg?: number }>> => {
  const today = new Date();
  const monthKeys = new Set<string>();
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    monthKeys.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
  }
  const merged: Record<string, { status: string; volumeKg?: number }> = {};
  await Promise.all(
    [...monthKeys].map(async (key) => {
      const [year, month] = key.split('-').map(Number);
      const monthMap = await WorkoutService.getMonthHistory(year, month);
      Object.assign(merged, monthMap);
    })
  );
  return merged;
};

/**
 * @description Hook de dados da tela de Estatísticas. Substitui os mocks antigos (radar/heatmap/
 * volume/medidas com `Math.random()` ou arrays fixos) por dado real via `WorkoutService` e
 * `BodyMetricsService` — nada aqui é inventado. Cobre as 3 abas: Performance (volume, equilíbrio
 * muscular, consistência), Corpo (evolução de peso/bioimpedância) e Medidas (circunferências).
 */
export const useStats = () => {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceStats>({
    weeklyVolume: [],
    volumeDeltaPct: null,
    muscleRadar: [],
    weakestMuscleAxis: null,
    heatmap: [],
    heatmapTrainedPct: 0,
  });
  const [bodyLatest, setBodyLatest] = useState<Record<string, number | null>>({});
  const [weightHistory, setWeightHistory] = useState<MetricPoint[]>([]);
  const [measuresLatest, setMeasuresLatest] = useState<Record<string, number | null>>({});
  const [measuresHistory, setMeasuresHistory] = useState<Record<string, MetricPoint[]>>({});

  const loadPerformance = useCallback(async () => {
    const [rawVolume, rawMuscle, heatmapSource] = await Promise.all([
      WorkoutService.getWeeklyVolume(8),
      WorkoutService.getMuscleBalance(),
      fetchHeatmapSource(),
    ]);

    // Volume semanal: marca a semana corrente e calcula a variação vs. a semana anterior.
    const day = new Date().getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date();
    monday.setDate(monday.getDate() - diffToMonday);
    const currentWeekKey = toISODate(monday);

    const weeklyVolume: VolumeWeek[] = rawVolume.map((w) => ({
      label: formatShortDatePt(w.weekLabel),
      volumeKg: w.volumeKg,
      isCurrent: w.weekLabel === currentWeekKey,
    }));
    let volumeDeltaPct: number | null = null;
    if (rawVolume.length >= 2) {
      const prev = rawVolume[rawVolume.length - 2].volumeKg;
      const last = rawVolume[rawVolume.length - 1].volumeKg;
      if (prev > 0) volumeDeltaPct = Math.round(((last - prev) / prev) * 100);
    }

    // Equilíbrio muscular: agrupa nos 6 eixos fixos e normaliza 0-100 relativo ao maior eixo.
    const axisVolume = new Map<string, number>(MUSCLE_AXES.map((a) => [a, 0]));
    for (const { bodyPart, volume } of rawMuscle) {
      const axis = MUSCLE_AXIS_MAP[bodyPart];
      if (!axis) continue;
      axisVolume.set(axis, (axisVolume.get(axis) || 0) + volume);
    }
    const maxAxisVolume = Math.max(...axisVolume.values());
    const muscleRadar: RadarAxis[] = maxAxisVolume > 0
      ? MUSCLE_AXES.map((label) => ({ label, value: Math.round(((axisVolume.get(label) || 0) / maxAxisVolume) * 100) }))
      : [];
    // Só sugere um "grupo mais fraco" quando há volume real em pelo menos 4 dos 6 eixos — com poucos
    // treinos registrados, os eixos ainda não trabalhados começam em 0 e sempre "vencem" como o mais
    // fraco matematicamente, soando como cobrança prematura (ver regra de zero-culpa do projeto).
    const trainedAxesCount = [...axisVolume.values()].filter((v) => v > 0).length;
    const weakestMuscleAxis = muscleRadar.length > 0 && trainedAxesCount >= 4
      ? muscleRadar.reduce((min, axis) => (axis.value < min.value ? axis : min)).label
      : null;

    // Heatmap: 98 dias mais recentes, do mais antigo pro mais novo (mesma ordem de leitura do grid).
    const volumesOfCompletedDays = Object.values(heatmapSource)
      .filter((v) => v.status === 'completed')
      .map((v) => v.volumeKg || 0);
    const maxVolume = Math.max(1, ...volumesOfCompletedDays);
    const heatmap: HeatmapDay[] = [];
    let trainedCount = 0;
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      const rec = heatmapSource[iso];
      let level: HeatmapDay['level'] = 0;
      if (rec?.status === 'completed') {
        trainedCount++;
        const vol = rec.volumeKg || 0;
        if (vol <= 0) level = 1;
        else if (vol >= maxVolume * 0.66) level = 3;
        else if (vol >= maxVolume * 0.33) level = 2;
        else level = 1;
      }
      heatmap.push({ date: iso, level });
    }
    const heatmapTrainedPct = Math.round((trainedCount / HEATMAP_DAYS) * 100);

    setPerformance({ weeklyVolume, volumeDeltaPct, muscleRadar, weakestMuscleAxis, heatmap, heatmapTrainedPct });
  }, []);

  const loadBody = useCallback(async () => {
    const [latest, history] = await Promise.all([
      BodyMetricsService.getLatestMany(BODY_METRICS.map((m) => m.key)),
      BodyMetricsService.getHistory('weight_kg'),
    ]);
    setBodyLatest(latest);
    setWeightHistory(history);
  }, []);

  const loadMeasures = useCallback(async () => {
    const latest = await BodyMetricsService.getLatestMany(MEASURE_METRICS.map((m) => m.key));
    setMeasuresLatest(latest);
    const historyEntries = await Promise.all(
      MEASURE_METRICS.map(async (m) => [m.key, await BodyMetricsService.getHistory(m.key)] as const)
    );
    setMeasuresHistory(Object.fromEntries(historyEntries));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadPerformance(), loadBody(), loadMeasures()]);
    } catch (error) {
      console.warn('[useStats] Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }, [loadPerformance, loadBody, loadMeasures]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  /** @description Registra uma nova medição (peso/bioimpedância ou circunferência) e recarrega a aba correspondente. */
  const logMetric = useCallback(async (key: MetricKey, value: number) => {
    await BodyMetricsService.logMetric(key, value);
    const isBodyMetric = BODY_METRICS.some((m) => m.key === key);
    if (isBodyMetric) await loadBody();
    else await loadMeasures();
  }, [loadBody, loadMeasures]);

  /** @description Histórico completo de uma métrica, sob demanda (ex: pro gráfico do modal de detalhe). */
  const fetchMetricHistory = useCallback((key: MetricKey) => BodyMetricsService.getHistory(key), []);

  return {
    loading,
    performance,
    bodyLatest,
    weightHistory,
    measuresLatest,
    measuresHistory,
    logMetric,
    fetchMetricHistory,
    refresh,
  };
};
