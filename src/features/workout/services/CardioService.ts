import { getDBConnection } from '../../../database/db';

export interface CardioEntry {
  id: string;
  date: string;
  activity: string;
  duration_minutes: number;
  distance_km: number | null;
  kcal_estimate: number | null;
}

/** @description ~kcal/min por atividade, estimativa grosseira (MET médio * 70kg) — só pra dar um número no card, não uma calculadora clínica. */
const KCAL_PER_MIN: Record<string, number> = {
  'Corrida': 11,
  'Caminhada': 5,
  'Futebol': 9,
  'Vôlei': 6,
  'Ciclismo': 8,
  'Natação': 10,
};
const DEFAULT_KCAL_PER_MIN = 7;

export class CardioService {
  static estimateKcal(activity: string, durationMinutes: number): number {
    const rate = KCAL_PER_MIN[activity] ?? DEFAULT_KCAL_PER_MIN;
    return Math.round(rate * durationMinutes);
  }

  static async logActivity(input: { activity: string; durationMinutes: number; distanceKm?: number | null; date?: string }): Promise<CardioEntry> {
    const db = await getDBConnection();
    const date = input.date || new Date().toISOString().slice(0, 10);
    const id = `cardio_${Date.now()}`;
    const kcal = this.estimateKcal(input.activity, input.durationMinutes);
    await db.runAsync(
      'INSERT INTO CardioLog (id, date, activity, duration_minutes, distance_km, kcal_estimate) VALUES (?, ?, ?, ?, ?, ?)',
      [id, date, input.activity, input.durationMinutes, input.distanceKm ?? null, kcal]
    );
    return { id, date, activity: input.activity, duration_minutes: input.durationMinutes, distance_km: input.distanceKm ?? null, kcal_estimate: kcal };
  }

  /** @description Últimas atividades registradas, mais recente primeiro — pra listar no card "Registrar Esporte/Cardio". */
  static async getRecent(limit: number = 10): Promise<CardioEntry[]> {
    const db = await getDBConnection();
    return db.getAllAsync('SELECT * FROM CardioLog ORDER BY date DESC, id DESC LIMIT ?', [limit]);
  }

  static async deleteEntry(id: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM CardioLog WHERE id = ?', [id]);
  }
}
