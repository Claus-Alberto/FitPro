import { getDBConnection } from '../../../database/db';
import { DaySchedule } from '../hooks/useWorkout';

const INITIAL_SEED: DaySchedule[] = [
  { id: '1', day: 'DOM', date: '23', status: 'rest', workout: null },
  { id: '2', day: 'SEG', date: '24', status: 'completed', workout: { title: 'Peito, Ombros & Tríceps', type: 'Push', id: 'A', duration: '58 min' } },
  { id: '3', day: 'TER', date: '25', status: 'skipped', workout: { title: 'Costas & Bíceps', type: 'Pull', id: 'B', duration: '60 min' } },
  { id: '4', day: 'QUA', date: '26', status: 'today', workout: { title: 'Pernas Completo', type: 'Legs', id: 'C', duration: '70 min', kcal: '500' } },
  { id: '5', day: 'QUI', date: '27', status: 'future', workout: { title: 'Peito & Tríceps (Foco Força)', type: 'Push B', id: 'A2', duration: '55 min' } },
  { id: '6', day: 'SEX', date: '28', status: 'future', workout: { title: 'Costas & Trapézio', type: 'Pull B', id: 'B2', duration: '60 min' } },
  { id: '7', day: 'SÁB', date: '29', status: 'future', workout: { title: 'Cardio & Abs', type: 'Active Rest', id: 'CR', duration: '40 min' } },
];

/**
 * @description Classe de Serviço que abstrai as Queries de SQLite diretamente aos componentes visuais.
 * Componentes devem consultar/modificar dados EXCLUSIVAMENTE interligando-se a essa camada via Hooks.
 */
export class WorkoutService {
  /**
   * Preenche a tabela inicial caso o banco de dados esteja vazio, permitindo testar o app offline.
   * @returns {Promise<void>}
   */
  static async seedInitialData(): Promise<void> {
    const db = await getDBConnection();
    
    const result: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM WorkoutSchedule');
    
    if (result && result.count === 0) {
      for (const item of INITIAL_SEED) {
        await db.runAsync(
          'INSERT INTO WorkoutSchedule (id, day, date, status, workout_data) VALUES (?, ?, ?, ?, ?)',
          [item.id, item.day, item.date, item.status, item.workout ? JSON.stringify(item.workout) : null]
        );
      }
      console.log('[WorkoutService] Dados iniciais (Seed) inseridos no SQLite local.');
    }
  }

  /**
   * Recupera todos os dados do cronograma sequencialmente pelo ID de criação.
   * @returns {Promise<DaySchedule[]>}
   */
  static async getWeeklySchedule(): Promise<DaySchedule[]> {
    const db = await getDBConnection();
    const rows: { id: string, day: string, date: string, status: string, workout_data: string | null }[] = await db.getAllAsync(
      'SELECT * FROM WorkoutSchedule ORDER BY CAST(id AS INTEGER) ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      day: row.day,
      date: row.date,
      status: row.status as DaySchedule['status'],
      workout: row.workout_data ? JSON.parse(row.workout_data) : null,
    }));
  }

  /**
   * Atualiza isoladamente o Status de um dia.
   * Útil para modais de "Pular" ou "Finalizar" Treino.
   * @param {string} id - ID numérico formatado como string.
   * @param {string} newStatus - 'rest' | 'completed' | 'skipped' | 'today' | 'future'
   * @returns {Promise<void>}
   */
  static async updateDayStatus(id: string, newStatus: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('UPDATE WorkoutSchedule SET status = ? WHERE id = ?', [newStatus, id]);
  }
}
