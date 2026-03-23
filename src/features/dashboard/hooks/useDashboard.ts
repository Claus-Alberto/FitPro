import { useState, useCallback } from 'react';
import STRINGS from '../../../constants/strings.json';

export interface WorkoutItem {
  id: string;
  day: string;
  date: string;
  status: 'completed' | 'skipped' | 'pending' | 'future';
  title: string;
}

const INITIAL_TIMELINE: WorkoutItem[] = [
  { id: '1', day: 'SEG', date: '24', status: 'completed', title: 'Peito & Tríceps' },
  { id: '2', day: 'TER', date: '25', status: 'skipped', title: 'Cardio (Pulou)' },
  { id: '3', day: 'HOJE', date: '26', status: 'pending', title: 'Dorsal & Bíceps' },
  { id: '4', day: 'QUI', date: '27', status: 'future', title: 'Pernas' },
  { id: '5', day: 'SEX', date: '28', status: 'future', title: 'Ombros' },
];

/**
 * @description Hook to manage Dashboard data and state.
 * Currently using mock data, but structured for easy API integration.
 */
export const useDashboard = () => {
  const [timeline, setTimeline] = useState<WorkoutItem[]>(INITIAL_TIMELINE);
  const [user, setUser] = useState({
    name: 'Claus',
    streak: 12,
    weight: 82.5,
  });

  const [nutrition, setNutrition] = useState({
    caloriesRemaining: 1250,
    macros: [
      { label: STRINGS.diet.header.protein, current: 90, total: 180, color: '#008E00' },
      { label: STRINGS.diet.header.carbs, current: 150, total: 300, color: '#3B82F6' },
      { label: STRINGS.diet.header.fat, current: 40, total: 80, color: '#F59E0B' },
    ]
  });

  const refreshDashboard = useCallback(() => {
    // Logic to fetch new data from API would go here
    console.log('Refreshing dashboard data...');
  }, []);

  return {
    user,
    timeline,
    nutrition,
    refreshDashboard,
  };
};
