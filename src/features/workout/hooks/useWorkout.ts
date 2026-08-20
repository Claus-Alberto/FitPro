import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { PAST_DAYS_WINDOW, WorkoutService } from '../services/WorkoutService';

export interface ProgramData {
  id: string;
  name: string;
  phase: string;
  week: number;
  total_weeks: number;
}

export interface WorkoutData {
  title: string;
  type: string;
  id: string;
  /** Letra da divisão (A/B/C...) — o que a UI deve exibir; `id` é o identificador real da
   *  sessão no banco, usado só pra carregar o treino, não pra mostrar. */
  letter?: string;
  duration: string;
  kcal?: string;
}

export interface DaySchedule {
  id: string;
  day: string;
  date: string;
  status: 'rest' | 'completed' | 'skipped' | 'today' | 'future';
  workout: WorkoutData | null;
}

export const INITIAL_INDEX = PAST_DAYS_WINDOW;

/**
 * @description Hook central da camada de treinos. Interage transparentemente
 * com o banco de dados nativo (expo-sqlite) por baixo dos panos através do WorkoutService.
 */
export const useWorkout = () => {
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schedulingMode, setSchedulingMode] = useState<'calendar' | 'queue'>('queue');
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_INDEX);
  const [selectedSkippedWorkout, setSelectedSkippedWorkout] = useState<DaySchedule | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Recarrega sempre que a tela ganha foco (não só no mount inicial) — sem isso, criar uma
  // ficha nova ou concluir um treino e voltar pra essa aba continuava mostrando os dados
  // antigos, porque a tela de Treino fica montada em segundo plano no tab navigator e um
  // `useEffect([])` de mount único nunca roda de novo ao apenas trocar de volta pra ela.
  useFocusEffect(
    useCallback(() => {
      fetchSchedule();
    }, [])
  );

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const mode = await WorkoutService.getSchedulingMode();
      setSchedulingMode(mode);

      const activeProg = await WorkoutService.getActiveProgram();
      if (activeProg) {
        setProgram({
          id: activeProg.id,
          name: activeProg.title,
          phase: activeProg.goal || 'Ficha Ativa',
          week: activeProg.week,
          total_weeks: activeProg.total_weeks
        });
      } else {
        setProgram(null);
      }

      const data = await WorkoutService.getWeeklySchedule();
      setSchedule(data);
    } catch (error) {
      console.warn('[useWorkout] Erro ao carregar SQLite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza o Status local e envia background request para o SQLite
   */
  const updateWorkoutStatus = async (id: string, newStatus: DaySchedule['status']) => {
    try {
      // 1. Atualiza persistência
      await WorkoutService.updateDayStatus(id, newStatus);
      // 2. Atualização otimista na fila de UI (sem refetching massivo delayado)
      setSchedule(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (error) {
      console.warn('[useWorkout] SQLite Mutate Failure:', error);
    }
  };

  const toggleSchedulingMode = async () => {
    const newMode = schedulingMode === 'calendar' ? 'queue' : 'calendar';
    try {
      await WorkoutService.setSchedulingMode(newMode);
      setSchedulingMode(newMode);
    } catch (e) { console.warn(e); }
  };

  return {
    program,
    schedule,
    isLoading,
    schedulingMode,
    toggleSchedulingMode,
    selectedIndex,
    setSelectedIndex,
    selectedSkippedWorkout,
    setSelectedSkippedWorkout,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    updateWorkoutStatus,
    refreshSchedule: fetchSchedule,
  };
};
