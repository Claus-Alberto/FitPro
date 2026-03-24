import { useState, useEffect } from 'react';
import { WorkoutService } from '../services/WorkoutService';

export interface ProgramData {
  name: string;
  phase: string;
  week: number;
  total_weeks: number;
}

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
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schedulingMode, setSchedulingMode] = useState<'calendar' | 'queue'>('queue');
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
      const mode = await WorkoutService.getSchedulingMode();
      setSchedulingMode(mode);

      const activeProg = await WorkoutService.getActiveProgram();
      if (activeProg) {
        setProgram({
          name: activeProg.title,
          phase: activeProg.goal || 'Ficha Ativa',
          week: 1, // Por enquanto fixo na semana 1 até implementarmos o contador de semanas
          total_weeks: 12
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
