import { useState, useEffect } from 'react';
import { WorkoutService } from '../services/WorkoutService';

export const CURRENT_PROGRAM = { name: "Projeto Verão 2025", phase: "Fase 2: Hipertrofia", week: 4, total_weeks: 12 };

export interface WorkoutData {
  title: string;
  type: string;
  id: string;
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

export const INITIAL_INDEX = 3;

/**
 * @description Hook central da camada de treinos. Interage transparentemente
 * com o banco de dados nativo (expo-sqlite) por baixo dos panos através do WorkoutService.
 */
export const useWorkout = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_INDEX);
  const [selectedSkippedWorkout, setSelectedSkippedWorkout] = useState<DaySchedule | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Assim que a tela monta, pedimos ao service para carregar o banco de dados
  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const data = await WorkoutService.getWeeklySchedule();
      if (data && data.length > 0) {
        setSchedule(data);
      }
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

  return {
    program: CURRENT_PROGRAM,
    schedule,
    isLoading,
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
