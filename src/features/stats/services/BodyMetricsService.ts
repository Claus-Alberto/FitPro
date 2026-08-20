import { getDBConnection } from '../../../database/db';

/** @description Chaves de métrica suportadas — cobre tanto "Evolução Corporal" (peso/composição) quanto "Medidas" (circunferências) da tela de Estatísticas, no mesmo modelo. */
export type MetricKey =
  | 'weight_kg' | 'body_fat_pct' | 'muscle_mass_kg' | 'bone_mass_kg' | 'water_pct'
  | 'biceps_cm' | 'chest_cm' | 'waist_cm' | 'thigh_cm' | 'calf_cm';

export interface MetricPoint {
  date: string;
  value: number;
}

export class BodyMetricsService {
  /** @description Registra uma medição pra uma métrica numa data (substitui se já existir registro na mesma data+métrica). */
  static async logMetric(metric: MetricKey, value: number, date: string = new Date().toISOString().slice(0, 10)): Promise<void> {
    const db = await getDBConnection();
    const existing: any = await db.getFirstAsync('SELECT id FROM BodyMetrics WHERE metric = ? AND date = ?', [metric, date]);
    if (existing) {
      await db.runAsync('UPDATE BodyMetrics SET value = ? WHERE id = ?', [value, existing.id]);
    } else {
      await db.runAsync('INSERT INTO BodyMetrics (id, date, metric, value) VALUES (?, ?, ?, ?)', [`bm_${metric}_${date}_${Date.now()}`, date, metric, value]);
    }
  }

  /** @description Histórico completo de uma métrica, mais antiga primeiro (pronto pra alimentar um gráfico de linha). */
  static async getHistory(metric: MetricKey): Promise<MetricPoint[]> {
    const db = await getDBConnection();
    return db.getAllAsync('SELECT date, value FROM BodyMetrics WHERE metric = ? ORDER BY date ASC', [metric]);
  }

  /** @description Valor mais recente de uma métrica, ou null se nunca foi registrada. */
  static async getLatest(metric: MetricKey): Promise<MetricPoint | null> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync('SELECT date, value FROM BodyMetrics WHERE metric = ? ORDER BY date DESC LIMIT 1', [metric]);
    return row || null;
  }

  /** @description Últimos valores de várias métricas de uma vez (ex: os 5 componentes da bioimpedância pro card "Evolução Corporal"). */
  static async getLatestMany(metrics: MetricKey[]): Promise<Record<string, number | null>> {
    const results = await Promise.all(metrics.map((m) => this.getLatest(m)));
    const out: Record<string, number | null> = {};
    metrics.forEach((m, i) => { out[m] = results[i]?.value ?? null; });
    return out;
  }
}
