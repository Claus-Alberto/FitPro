import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import STRINGS from '../../../constants/strings.json';
import { COLORS } from '../../../constants/theme';
import { WorkoutService } from '../../workout/services/WorkoutService';
import { CardioService } from '../../workout/services/CardioService';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TON_IN_KG = 1000;
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  isEvent: boolean;
  /** Texto legível de progresso real (ex: "23/30 dias de streak"), nunca um % inventado. */
  progressLabel: string;
  /** 0-100, usado só pra desenhar a barrinha de progresso. */
  progressPercent: number;
}

export interface PersonalRecordItem {
  id: string;
  exerciseName: string;
  weightLabel: string;
  weightValue: number;
  date: string;
  isNew: boolean;
}

export interface ChartPoint {
  date: string;
  value: number;
}

/** @description Formata uma data ISO 'YYYY-MM-DD' como 'DD Mmm AAAA', sem depender do locale do dispositivo. */
const formatDateLongPt = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')} ${MONTHS_PT[m - 1]} ${y}`;
};

/** @description Formata uma data ISO 'YYYY-MM-DD' como 'DD/MM', pro eixo X dos gráficos de evolução. */
const formatDateShortPt = (iso: string): string => {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

/**
 * @description Hook de dados da tela de Conquistas. Calcula todas as medalhas e recordes pessoais
 * a partir de dado real (WorkoutService/CardioService) — nenhum valor aqui é mockado. Cada medalha
 * bloqueada carrega um `progressLabel` com o progresso real do usuário (não um % inventado).
 */
export const useAchievements = () => {
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [eventBadges, setEventBadges] = useState<AchievementBadge[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecordItem[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lifetime, currentStreak, prs, cardioRecent] = await Promise.all([
        WorkoutService.getLifetimeStats(),
        WorkoutService.getCurrentStreak(),
        WorkoutService.getPersonalRecords(20),
        CardioService.getRecent(1),
      ]);

      const thisYear = new Date().getFullYear();
      const [christmasDone, newYearThisYear, newYearLastYear] = await Promise.all([
        WorkoutService.hasCompletedWorkoutOnCalendarDate('12-25'),
        WorkoutService.hasCompletedStreakInRange(`${thisYear}-01-01`, `${thisYear}-01-07`),
        WorkoutService.hasCompletedStreakInRange(`${thisYear - 1}-01-01`, `${thisYear - 1}-01-07`),
      ]);
      const newYearDone = newYearThisYear || newYearLastYear;

      const tons = lifetime.totalVolumeKg / TON_IN_KG;
      const hasPR = prs.length >= 1;
      const hasCardio = cardioRecent.length >= 1;

      const progressBadges: AchievementBadge[] = [
        {
          id: 'first_steps',
          title: STRINGS.achievements.badges.firstSteps.title,
          description: STRINGS.achievements.badges.firstSteps.desc,
          icon: 'shoe-print',
          color: COLORS.primary,
          unlocked: lifetime.totalWorkouts >= 1,
          isEvent: false,
          progressLabel: lifetime.totalWorkouts >= 1 ? STRINGS.achievements.progress.unlockedLabel : STRINGS.achievements.progress.locked,
          progressPercent: Math.min(100, lifetime.totalWorkouts * 100),
        },
        {
          id: 'consistency',
          title: STRINGS.achievements.badges.consistency.title,
          description: STRINGS.achievements.badges.consistency.desc,
          icon: 'fire',
          color: COLORS.accent,
          unlocked: currentStreak >= 7,
          isEvent: false,
          progressLabel: STRINGS.achievements.progress.streakDays
            .replace('{current}', String(Math.min(currentStreak, 7)))
            .replace('{target}', '7'),
          progressPercent: Math.min(100, (currentStreak / 7) * 100),
        },
        {
          id: 'iron_discipline',
          title: STRINGS.achievements.badges.ironDiscipline.title,
          description: STRINGS.achievements.badges.ironDiscipline.desc,
          icon: 'shield-star',
          color: COLORS.info,
          unlocked: currentStreak >= 30,
          isEvent: false,
          progressLabel: STRINGS.achievements.progress.streakDays
            .replace('{current}', String(Math.min(currentStreak, 30)))
            .replace('{target}', '30'),
          progressPercent: Math.min(100, (currentStreak / 30) * 100),
        },
        {
          id: 'early_bird',
          title: STRINGS.achievements.badges.earlyBird.title,
          description: STRINGS.achievements.badges.earlyBird.desc,
          icon: 'weather-sunset-up',
          color: COLORS.info,
          unlocked: lifetime.earlyMorningCount >= 1,
          isEvent: false,
          progressLabel: lifetime.earlyMorningCount >= 1 ? STRINGS.achievements.progress.unlockedLabel : STRINGS.achievements.progress.locked,
          progressPercent: Math.min(100, lifetime.earlyMorningCount * 100),
        },
        {
          id: 'heavy_weight',
          title: STRINGS.achievements.badges.heavyWeight.title,
          description: STRINGS.achievements.badges.heavyWeight.desc,
          icon: 'weight-lifter',
          color: COLORS.premium,
          unlocked: tons >= 10,
          isEvent: false,
          progressLabel: STRINGS.achievements.progress.tons
            .replace('{current}', Math.min(tons, 10).toFixed(1))
            .replace('{target}', '10'),
          progressPercent: Math.min(100, (tons / 10) * 100),
        },
        {
          id: 'iron_marathon',
          title: STRINGS.achievements.badges.ironMarathon.title,
          description: STRINGS.achievements.badges.ironMarathon.desc,
          icon: 'dumbbell',
          color: COLORS.accent,
          unlocked: tons >= 50,
          isEvent: false,
          progressLabel: STRINGS.achievements.progress.tons
            .replace('{current}', Math.min(tons, 50).toFixed(1))
            .replace('{target}', '50'),
          progressPercent: Math.min(100, (tons / 50) * 100),
        },
        {
          id: 'century',
          title: STRINGS.achievements.badges.century.title,
          description: STRINGS.achievements.badges.century.desc,
          icon: 'trophy-award',
          color: COLORS.accent,
          unlocked: lifetime.totalWorkouts >= 100,
          isEvent: false,
          progressLabel: STRINGS.achievements.progress.workoutsCount
            .replace('{current}', String(Math.min(lifetime.totalWorkouts, 100)))
            .replace('{target}', '100'),
          progressPercent: Math.min(100, (lifetime.totalWorkouts / 100) * 100),
        },
        {
          id: 'record_holder',
          title: STRINGS.achievements.badges.recordHolder.title,
          description: STRINGS.achievements.badges.recordHolder.desc,
          icon: 'trophy-variant',
          color: COLORS.primary,
          unlocked: hasPR,
          isEvent: false,
          progressLabel: hasPR ? STRINGS.achievements.progress.unlockedLabel : STRINGS.achievements.progress.locked,
          progressPercent: hasPR ? 100 : 0,
        },
        {
          id: 'complete_athlete',
          title: STRINGS.achievements.badges.completeAthlete.title,
          description: STRINGS.achievements.badges.completeAthlete.desc,
          icon: 'run',
          color: COLORS.info,
          unlocked: hasCardio,
          isEvent: false,
          progressLabel: hasCardio ? STRINGS.achievements.progress.unlockedLabel : STRINGS.achievements.progress.locked,
          progressPercent: hasCardio ? 100 : 0,
        },
      ];

      const seasonalBadges: AchievementBadge[] = [
        {
          id: 'christmas',
          title: STRINGS.achievements.badges.christmas.title,
          description: STRINGS.achievements.badges.christmas.desc,
          icon: 'pine-tree',
          color: COLORS.accent,
          unlocked: christmasDone,
          isEvent: true,
          progressLabel: christmasDone ? STRINGS.achievements.progress.unlockedLabel : STRINGS.achievements.progress.locked,
          progressPercent: christmasDone ? 100 : 0,
        },
        {
          id: 'new_year',
          title: STRINGS.achievements.badges.newYear.title,
          description: STRINGS.achievements.badges.newYear.desc,
          icon: 'party-popper',
          color: COLORS.accent,
          unlocked: newYearDone,
          isEvent: true,
          progressLabel: newYearDone ? STRINGS.achievements.progress.unlockedLabel : STRINGS.achievements.progress.locked,
          progressPercent: newYearDone ? 100 : 0,
        },
      ];

      const today = new Date();
      const prItems: PersonalRecordItem[] = prs.map((r, index) => {
        const recordDate = new Date(r.date);
        const daysAgo = Math.floor((today.getTime() - recordDate.getTime()) / MS_PER_DAY);
        return {
          id: `pr_${index}_${r.exerciseName}`,
          exerciseName: r.exerciseName,
          weightLabel: `${r.maxWeight} kg`,
          weightValue: r.maxWeight,
          date: formatDateLongPt(r.date),
          isNew: daysAgo >= 0 && daysAgo <= 7,
        };
      });

      setTotalWorkouts(lifetime.totalWorkouts);
      setStreak(currentStreak);
      setBadges(progressBadges);
      setEventBadges(seasonalBadges);
      setPersonalRecords(prItems);
    } catch (error) {
      console.warn('[useAchievements] Erro ao carregar conquistas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /** @description Histórico de peso máximo por treino de um exercício, pronto pro `LineChart` do detalhe de um PR. */
  const getExerciseHistory = useCallback(async (exerciseName: string): Promise<ChartPoint[]> => {
    const rows = await WorkoutService.getExerciseWeightHistory(exerciseName);
    return rows.map((r) => ({ date: formatDateShortPt(r.date), value: r.value }));
  }, []);

  const unlockedCount = badges.filter((b) => b.unlocked).length + eventBadges.filter((b) => b.unlocked).length;
  const totalBadgeCount = badges.length + eventBadges.length;

  return {
    loading,
    totalWorkouts,
    streak,
    badges,
    eventBadges,
    personalRecords,
    unlockedCount,
    totalBadgeCount,
    getExerciseHistory,
    refresh: load,
  };
};
