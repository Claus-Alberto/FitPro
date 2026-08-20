import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { DietService, Meal, NutritionGoals, FoodEntry } from '../services/DietService';

const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * @description Hook central da camada de dieta (refeições, itens, água, metas). Espelha o
 * padrão de `useWorkout`: recarrega ao ganhar foco (não só no mount) e interage com o SQLite
 * por baixo dos panos via `DietService`, sempre para o dia de hoje.
 */
export const useDiet = () => {
  const today = toISODate(new Date());

  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>({ kcal: 2600, protein: 180, carb: 300, fat: 80 });
  const [totals, setTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const [water, setWater] = useState(0);
  const [waterGoal, setWaterGoalState] = useState(2000);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [mealsData, goalsData, totalsData, waterData, waterGoalData] = await Promise.all([
        DietService.getMealsForDate(today),
        DietService.getNutritionGoals(),
        DietService.getDailyTotals(today),
        DietService.getWaterForDate(today),
        DietService.getWaterGoal(),
      ]);
      setMeals(mealsData);
      setGoals(goalsData);
      setTotals(totalsData);
      setWater(waterData);
      setWaterGoalState(waterGoalData);
    } catch (error) {
      console.warn('[useDiet] Erro ao carregar SQLite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMealsAndTotals = async () => {
    const [mealsData, totalsData] = await Promise.all([
      DietService.getMealsForDate(today),
      DietService.getDailyTotals(today),
    ]);
    setMeals(mealsData);
    setTotals(totalsData);
  };

  const addFoodToMeal = async (mealId: string, food: FoodEntry, quantityGrams: number, unitLabel: string) => {
    await DietService.addMealItem(mealId, { id: food.id, name: food.name }, quantityGrams, unitLabel, food);
    await refreshMealsAndTotals();
  };

  const updateMealItem = async (itemId: string, quantityGrams: number, unitLabel: string, food: { kcal_100g: number; protein_100g: number; carb_100g: number; fat_100g: number }) => {
    await DietService.updateMealItem(itemId, quantityGrams, unitLabel, food);
    await refreshMealsAndTotals();
  };

  const removeMealItem = async (itemId: string) => {
    await DietService.removeMealItem(itemId);
    await refreshMealsAndTotals();
  };

  const clearMealItems = async (mealId: string) => {
    await DietService.clearMealItems(mealId);
    await refreshMealsAndTotals();
  };

  const createMeal = async (title: string, time: string) => {
    await DietService.createMeal(today, title, time);
    await refreshMealsAndTotals();
  };

  const deleteMeal = async (mealId: string) => {
    await DietService.deleteMeal(mealId);
    await refreshMealsAndTotals();
  };

  const updateMealTime = async (mealId: string, time: string) => {
    await DietService.updateMealTime(mealId, time);
    await refreshMealsAndTotals();
  };

  const addWater = async (ml: number) => {
    const next = await DietService.addWater(today, ml);
    setWater(next);
  };

  const setWaterGoal = async (ml: number) => {
    await DietService.setWaterGoal(ml);
    setWaterGoalState(ml);
  };

  return {
    today,
    meals,
    goals,
    totals,
    water,
    waterGoal,
    isLoading,
    addFoodToMeal,
    updateMealItem,
    removeMealItem,
    clearMealItems,
    createMeal,
    deleteMeal,
    updateMealTime,
    addWater,
    setWaterGoal,
    refresh: fetchAll,
  };
};
