import { getDBConnection } from '../../../database/db';
import STRINGS from '../../../constants/strings.json';

export interface FoodEntry {
  id: string;
  name: string;
  category: string | null;
  kcal_100g: number;
  protein_100g: number;
  carb_100g: number;
  fat_100g: number;
  fiber_100g: number;
  sodium_100g_mg: number;
  source: 'taco' | 'custom' | 'off';
  barcode: string | null;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string | null;
  food_name: string;
  quantity: number;
  unit: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  date: string;
  title: string;
  time: string;
  icon: string;
  is_default: boolean;
  order_index: number;
  items: MealItem[];
}

export interface NutritionGoals {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

const DEFAULT_GOALS: NutritionGoals = { kcal: 2600, protein: 180, carb: 300, fat: 80 };

const DEFAULT_MEAL_TEMPLATE: { title: string; time: string; icon: string }[] = [
  { title: STRINGS.diet.meals.breakfast, time: '08:00', icon: 'coffee-outline' },
  { title: STRINGS.diet.meals.lunch, time: '12:30', icon: 'food-drumstick-outline' },
  { title: STRINGS.diet.meals.snack, time: '16:00', icon: 'cookie-outline' },
  { title: STRINGS.diet.meals.dinner, time: '20:00', icon: 'food-steak' },
];

/** @description Calcula os macros (kcal/proteína/carbo/gordura) de uma quantidade em gramas a partir dos valores por 100g de um alimento. */
const calcMacros = (per100: { kcal_100g: number; protein_100g: number; carb_100g: number; fat_100g: number }, grams: number) => ({
  kcal: Math.round((per100.kcal_100g * grams) / 100),
  protein: Math.round((per100.protein_100g * grams) / 100),
  carbs: Math.round((per100.carb_100g * grams) / 100),
  fat: Math.round((per100.fat_100g * grams) / 100),
});

export class DietService {
  // == BANCO DE ALIMENTOS (base pública TACO/NEPA-UNICAMP, MIT, já em pt-BR) ==

  /** @description Seeda o catálogo de alimentos uma única vez (idempotente — checa contagem antes). */
  static async seedFoodDatabase(): Promise<void> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync("SELECT COUNT(*) as count FROM Foods WHERE source = 'taco'");
    if ((row?.count || 0) > 0) return;

    // Import tardio: só carrega o JSON (~600 itens) quando de fato precisa seedar.
    const foods: any[] = require('../../../data/foods.json');

    const BATCH_SIZE = 50;
    for (let i = 0; i < foods.length; i += BATCH_SIZE) {
      const batch = foods.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const params: any[] = [];
      for (const f of batch) {
        params.push(f.id, f.name, f.category, f.kcal_100g, f.protein_100g, f.carb_100g, f.fat_100g, f.fiber_100g, f.sodium_100g_mg, 'taco');
      }
      await db.runAsync(
        `INSERT OR IGNORE INTO Foods (id, name, category, kcal_100g, protein_100g, carb_100g, fat_100g, fiber_100g, sodium_100g_mg, source) VALUES ${placeholders}`,
        params
      );
    }
  }

  /** @description Busca no catálogo de alimentos por nome (TACO + customs do usuário). Limitado a 50 resultados. */
  static async searchFoods(query: string): Promise<FoodEntry[]> {
    const db = await getDBConnection();
    const rows: any[] = query.trim()
      ? await db.getAllAsync('SELECT * FROM Foods WHERE name LIKE ? ORDER BY name ASC LIMIT 50', [`%${query.trim()}%`])
      : await db.getAllAsync('SELECT * FROM Foods ORDER BY name ASC LIMIT 50');
    return rows;
  }

  static async getFoodById(id: string): Promise<FoodEntry | null> {
    const db = await getDBConnection();
    return db.getFirstAsync('SELECT * FROM Foods WHERE id = ?', [id]);
  }

  /** @description Cria um alimento customizado pelo usuário (macros informados por 100g). */
  static async createCustomFood(input: { name: string; kcal_100g: number; protein_100g: number; carb_100g: number; fat_100g: number }): Promise<FoodEntry> {
    const db = await getDBConnection();
    const id = `custom_${Date.now()}`;
    await db.runAsync(
      `INSERT INTO Foods (id, name, category, kcal_100g, protein_100g, carb_100g, fat_100g, fiber_100g, sodium_100g_mg, source)
       VALUES (?, ?, NULL, ?, ?, ?, ?, 0, 0, 'custom')`,
      [id, input.name, input.kcal_100g, input.protein_100g, input.carb_100g, input.fat_100g]
    );
    return { id, name: input.name, category: null, kcal_100g: input.kcal_100g, protein_100g: input.protein_100g, carb_100g: input.carb_100g, fat_100g: input.fat_100g, fiber_100g: 0, sodium_100g_mg: 0, source: 'custom', barcode: null };
  }

  /**
   * @description Cria uma receita a partir de ingredientes (cada um já um `FoodEntry` + quantidade
   * em gramas). Em vez de um conceito à parte, a receita vira um `Foods` normal: soma os macros e o
   * peso total dos ingredientes e grava a taxa resultante por 100g (média ponderada real da receita) —
   * assim ela funciona com o mesmo fluxo de busca/quantidade de qualquer outro alimento, sem
   * precisar de tabela ou lógica de cálculo separada. `suggestedGramsPerServing` é só uma sugestão
   * de preenchimento inicial da quantidade na tela (peso total / nº de porções).
   */
  static async createRecipe(name: string, ingredients: { food: { kcal_100g: number; protein_100g: number; carb_100g: number; fat_100g: number }; quantityGrams: number }[], servings: number): Promise<FoodEntry & { suggestedGramsPerServing: number }> {
    const totalGrams = ingredients.reduce((acc, i) => acc + i.quantityGrams, 0) || 1;
    const totals = ingredients.reduce((acc, i) => ({
      kcal: acc.kcal + (i.food.kcal_100g * i.quantityGrams) / 100,
      protein: acc.protein + (i.food.protein_100g * i.quantityGrams) / 100,
      carb: acc.carb + (i.food.carb_100g * i.quantityGrams) / 100,
      fat: acc.fat + (i.food.fat_100g * i.quantityGrams) / 100,
    }), { kcal: 0, protein: 0, carb: 0, fat: 0 });

    const food = await this.createCustomFood({
      name,
      kcal_100g: Math.round((totals.kcal / totalGrams) * 100 * 100) / 100,
      protein_100g: Math.round((totals.protein / totalGrams) * 100 * 100) / 100,
      carb_100g: Math.round((totals.carb / totalGrams) * 100 * 100) / 100,
      fat_100g: Math.round((totals.fat / totalGrams) * 100 * 100) / 100,
    });

    return { ...food, suggestedGramsPerServing: Math.round(totalGrams / Math.max(1, servings)) };
  }

  /**
   * @description Busca um produto pelo código de barras: primeiro no cache local (Foods.barcode),
   * senão consulta a API pública do Open Food Facts (sem chave/auth) e cacheia o resultado.
   * Retorna null se o produto não existir na base ou a rede falhar — o chamador deve oferecer
   * cadastro manual como fallback.
   */
  static async lookupBarcode(barcode: string): Promise<FoodEntry | null> {
    const db = await getDBConnection();
    const cached: any = await db.getFirstAsync('SELECT * FROM Foods WHERE barcode = ?', [barcode]);
    if (cached) return cached;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_pt,nutriments`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;

      const data: any = await res.json();
      if (data.status !== 1 || !data.product) return null;

      const n = data.product.nutriments || {};
      const name = data.product.product_name_pt || data.product.product_name;
      if (!name) return null;

      const id = `off_${barcode}`;
      const kcal_100g = n['energy-kcal_100g'] ?? 0;
      const protein_100g = n['proteins_100g'] ?? 0;
      const carb_100g = n['carbohydrates_100g'] ?? 0;
      const fat_100g = n['fat_100g'] ?? 0;
      const fiber_100g = n['fiber_100g'] ?? 0;
      const sodium_100g_mg = (n['sodium_100g'] ?? 0) * 1000;

      await db.runAsync(
        `INSERT OR REPLACE INTO Foods (id, name, category, kcal_100g, protein_100g, carb_100g, fat_100g, fiber_100g, sodium_100g_mg, source, barcode)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 'off', ?)`,
        [id, name, kcal_100g, protein_100g, carb_100g, fat_100g, fiber_100g, sodium_100g_mg, barcode]
      );
      return { id, name, category: null, kcal_100g, protein_100g, carb_100g, fat_100g, fiber_100g, sodium_100g_mg, source: 'off', barcode };
    } catch {
      return null; // offline ou timeout — chamador cai no fluxo manual
    }
  }

  // == REFEIÇÕES / DIÁRIO (por data) ==

  /** @description Retorna as refeições de uma data com seus itens; na primeira consulta de um dia novo, cria as 4 refeições padrão (café/almoço/lanche/janta) vazias. */
  static async getMealsForDate(date: string): Promise<Meal[]> {
    const db = await getDBConnection();
    const existing: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM Meals WHERE date = ?', [date]);
    if ((existing?.count || 0) === 0) {
      for (const [index, m] of DEFAULT_MEAL_TEMPLATE.entries()) {
        await db.runAsync(
          'INSERT INTO Meals (id, date, title, time, icon, is_default, order_index) VALUES (?, ?, ?, ?, ?, 1, ?)',
          [`meal_${date}_${index}`, date, m.title, m.time, m.icon, index]
        );
      }
    }

    const meals: any[] = await db.getAllAsync('SELECT * FROM Meals WHERE date = ? ORDER BY time ASC', [date]);
    for (const meal of meals) {
      meal.items = await db.getAllAsync('SELECT * FROM MealItems WHERE meal_id = ?', [meal.id]);
      meal.is_default = !!meal.is_default;
    }
    return meals;
  }

  static async createMeal(date: string, title: string, time: string): Promise<string> {
    const db = await getDBConnection();
    const id = `meal_${date}_custom_${Date.now()}`;
    await db.runAsync('INSERT INTO Meals (id, date, title, time, icon, is_default, order_index) VALUES (?, ?, ?, ?, ?, 0, 99)', [id, date, title, time, 'food-apple-outline']);
    return id;
  }

  static async updateMealTime(mealId: string, time: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('UPDATE Meals SET time = ? WHERE id = ?', [time, mealId]);
  }

  /** @description Apaga uma refeição e seus itens (via CASCADE). */
  static async deleteMeal(mealId: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM Meals WHERE id = ?', [mealId]);
  }

  static async clearMealItems(mealId: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM MealItems WHERE meal_id = ?', [mealId]);
  }

  /** @description Adiciona um alimento a uma refeição, gravando os macros já calculados (não recalcula depois se o alimento em Foods mudar). */
  static async addMealItem(mealId: string, food: { id: string | null; name: string }, quantityGrams: number, unitLabel: string, per100: { kcal_100g: number; protein_100g: number; carb_100g: number; fat_100g: number }): Promise<MealItem> {
    const db = await getDBConnection();
    const macros = calcMacros(per100, quantityGrams);
    const id = `item_${Date.now()}_${Math.round(Math.random() * 1000)}`;
    await db.runAsync(
      'INSERT INTO MealItems (id, meal_id, food_id, food_name, quantity, unit, kcal, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, mealId, food.id, food.name, quantityGrams, unitLabel, macros.kcal, macros.protein, macros.carbs, macros.fat]
    );
    return { id, meal_id: mealId, food_id: food.id, food_name: food.name, quantity: quantityGrams, unit: unitLabel, ...macros };
  }

  static async updateMealItem(itemId: string, quantityGrams: number, unitLabel: string, per100: { kcal_100g: number; protein_100g: number; carb_100g: number; fat_100g: number }): Promise<void> {
    const db = await getDBConnection();
    const macros = calcMacros(per100, quantityGrams);
    await db.runAsync('UPDATE MealItems SET quantity = ?, unit = ?, kcal = ?, protein = ?, carbs = ?, fat = ? WHERE id = ?', [quantityGrams, unitLabel, macros.kcal, macros.protein, macros.carbs, macros.fat, itemId]);
  }

  static async removeMealItem(itemId: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM MealItems WHERE id = ?', [itemId]);
  }

  /** @description Soma kcal/proteína/carbo/gordura de todos os itens de todas as refeições de uma data — usado pelo header da dieta e pelo card de nutrição da Home. */
  static async getDailyTotals(date: string): Promise<{ kcal: number; protein: number; carbs: number; fat: number }> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync(
      `SELECT COALESCE(SUM(mi.kcal),0) as kcal, COALESCE(SUM(mi.protein),0) as protein, COALESCE(SUM(mi.carbs),0) as carbs, COALESCE(SUM(mi.fat),0) as fat
       FROM MealItems mi JOIN Meals m ON m.id = mi.meal_id WHERE m.date = ?`,
      [date]
    );
    return { kcal: row?.kcal || 0, protein: row?.protein || 0, carbs: row?.carbs || 0, fat: row?.fat || 0 };
  }

  // == ÁGUA ==

  static async getWaterForDate(date: string): Promise<number> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync('SELECT ml_total FROM WaterLog WHERE date = ?', [date]);
    return row?.ml_total || 0;
  }

  static async addWater(date: string, ml: number): Promise<number> {
    const db = await getDBConnection();
    const current = await this.getWaterForDate(date);
    const next = Math.max(0, current + ml);
    await db.runAsync('INSERT INTO WaterLog (date, ml_total) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET ml_total = ?', [date, next, next]);
    return next;
  }

  // == METAS NUTRICIONAIS (UserPreferences, mesmo padrão de schedulingMode/queueCursor) ==

  static async getNutritionGoals(): Promise<NutritionGoals> {
    const db = await getDBConnection();
    const rows: any[] = await db.getAllAsync("SELECT key, value FROM UserPreferences WHERE key IN ('goal_kcal','goal_protein','goal_carb','goal_fat')");
    const map: Record<string, number> = {};
    for (const r of rows) map[r.key] = parseFloat(r.value);
    return {
      kcal: map.goal_kcal ?? DEFAULT_GOALS.kcal,
      protein: map.goal_protein ?? DEFAULT_GOALS.protein,
      carb: map.goal_carb ?? DEFAULT_GOALS.carb,
      fat: map.goal_fat ?? DEFAULT_GOALS.fat,
    };
  }

  static async setNutritionGoals(goals: NutritionGoals): Promise<void> {
    const db = await getDBConnection();
    const entries: [string, number][] = [['goal_kcal', goals.kcal], ['goal_protein', goals.protein], ['goal_carb', goals.carb], ['goal_fat', goals.fat]];
    for (const [key, value] of entries) {
      await db.runAsync('INSERT INTO UserPreferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', [key, String(value), String(value)]);
    }
  }

  static async getWaterGoal(): Promise<number> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync("SELECT value FROM UserPreferences WHERE key = 'goal_water_ml'");
    return row?.value ? parseInt(row.value, 10) : 2000;
  }

  static async setWaterGoal(ml: number): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync("INSERT INTO UserPreferences (key, value) VALUES ('goal_water_ml', ?) ON CONFLICT(key) DO UPDATE SET value = ?", [String(ml), String(ml)]);
  }
}
