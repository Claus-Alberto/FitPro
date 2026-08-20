import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import STRINGS from '../../../constants/strings.json';
import { COLORS } from '../../../constants/theme';
import { WorkoutService } from '../../workout/services/WorkoutService';
import { DietService } from '../../diet/services/DietService';
import { BodyMetricsService } from '../../stats/services/BodyMetricsService';

export interface WorkoutItem {
  id: string;
  day: string;
  date: string;
  status: 'completed' | 'skipped' | 'pending' | 'future';
  title: string;
  /** false quando não há nenhum treino registrado/agendado pro dia (nunca houve ficha ativa,
   *  ou o app não foi aberto naquele dia) — distinto de um 'skipped' real (treino agendado que
   *  o usuário de fato não fez), pra não tratar "sem dado" como "falhou" na timeline. */
  hasData: boolean;
}

const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

/** @description Mapeia o status real do WorkoutV3 (WorkoutService) pro vocabulário visual da timeline da Home. */
const toTimelineStatus = (status: string): WorkoutItem['status'] => {
  if (status === 'completed') return 'completed';
  if (status === 'skipped') return 'skipped';
  if (status === 'today') return 'pending';
  return 'future';
};

/**
 * @description Hook de dados da Home. Lê o estado real de treino (WorkoutService), nutrição
 * (DietService) e peso corporal (BodyMetricsService) — nada aqui é mock. `user.name` permanece
 * estático: onboarding ainda não persiste nome de perfil hoje. `user.weight` é null até o
 * usuário registrar o primeiro peso (card "Peso Monitorado" da Home ou tela de Perfil).
 */
export const useDashboard = () => {
  const [timeline, setTimeline] = useState<WorkoutItem[]>([]);
  const [user, setUser] = useState<{ name: string; streak: number; weight: number | null }>({ name: 'Claus', streak: 0, weight: null });
  const [nutrition, setNutrition] = useState({
    caloriesRemaining: 0,
    progress: 0,
    macros: [
      { label: STRINGS.diet.header.protein, current: 0, total: 0, color: COLORS.primary },
      { label: STRINGS.diet.header.carbs, current: 0, total: 0, color: COLORS.info },
      { label: STRINGS.diet.header.fat, current: 0, total: 0, color: COLORS.accent },
    ],
  });
  const [water, setWater] = useState(0);
  const [waterGoal, setWaterGoalState] = useState(2000);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [])
  );

  const refreshDashboard = useCallback(async () => {
    try {
      const today = toISODate(new Date());
      const [schedule, streak, totals, goals, waterMl, waterGoalMl, latestWeight] = await Promise.all([
        WorkoutService.getWeeklySchedule(),
        WorkoutService.getCurrentStreak(),
        DietService.getDailyTotals(today),
        DietService.getNutritionGoals(),
        DietService.getWaterForDate(today),
        DietService.getWaterGoal(),
        BodyMetricsService.getLatest('weight_kg'),
      ]);

      setTimeline(
        schedule.map((day) => ({
          id: day.id,
          day: day.day,
          date: day.date,
          status: toTimelineStatus(day.status),
          title: day.workout?.type || day.workout?.title || STRINGS.dashboard.journey.noRecord,
          hasData: day.workout !== null,
        }))
      );

      setUser((prev) => ({ ...prev, streak, weight: latestWeight ? latestWeight.value : null }));

      setNutrition({
        caloriesRemaining: Math.round(goals.kcal - totals.kcal),
        progress: goals.kcal > 0 ? totals.kcal / goals.kcal : 0,
        macros: [
          { label: STRINGS.diet.header.protein, current: totals.protein, total: goals.protein, color: COLORS.primary },
          { label: STRINGS.diet.header.carbs, current: totals.carbs, total: goals.carb, color: COLORS.info },
          { label: STRINGS.diet.header.fat, current: totals.fat, total: goals.fat, color: COLORS.accent },
        ],
      });

      setWater(waterMl);
      setWaterGoalState(waterGoalMl);
    } catch (error) {
      console.warn('[useDashboard] Erro ao carregar dados reais:', error);
    }
  }, []);

  const addWater = useCallback(async (ml: number) => {
    const next = await DietService.addWater(toISODate(new Date()), ml);
    setWater(next);
  }, []);

  const setWaterGoal = useCallback(async (ml: number) => {
    await DietService.setWaterGoal(ml);
    setWaterGoalState(ml);
  }, []);

  return {
    user,
    timeline,
    nutrition,
    water,
    waterGoal,
    addWater,
    setWaterGoal,
    refreshDashboard,
  };
};
