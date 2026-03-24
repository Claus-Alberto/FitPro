import { getDBConnection } from '../../../database/db';
import { DaySchedule } from '../hooks/useWorkout';

// O BLANK_SEED agora só define a estrutura básica de dias para quando não há nada no log.
const getBlankWeek = (): DaySchedule[] => {
  const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const today = new Date();
  
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - 3 + i); // 3 dias atrás até 3 dias à frente
    return {
      id: `day_${i}`,
      day: days[d.getDay()],
      date: d.getDate().toString(),
      status: i === 3 ? 'today' : (i < 3 ? 'skipped' : 'future'),
      workout: null
    };
  });
};

export class WorkoutService {
  static async seedInitialData(): Promise<void> {
    // Não vamos mais seedar dados fakes no WorkoutV3.
    // O banco deve começar limpo para o usuário criar sua própria ficha.
  }

  // == PREFERENCES API ==
  static async getSchedulingMode(): Promise<'calendar' | 'queue'> {
    const db = await getDBConnection();
    const result: any = await db.getFirstAsync('SELECT value FROM UserPreferences WHERE key = "schedulingMode"');
    return (result?.value as 'calendar' | 'queue') || 'queue';
  }

  static async setSchedulingMode(mode: 'calendar' | 'queue'): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('UPDATE UserPreferences SET value = ? WHERE key = "schedulingMode"', [mode]);
  }

  // == PROGRAMS API ==
  static async getActiveProgram(): Promise<any> {
    const db = await getDBConnection();
    const program: any = await db.getFirstAsync('SELECT * FROM WorkoutPrograms WHERE is_active = 1');
    if (!program) return null;
    
    const sessions = await db.getAllAsync('SELECT * FROM WorkoutSessions WHERE program_id = ? ORDER BY letter ASC', [program.id]);
    return { ...program, sessions };
  }

  static async saveNewProgram(programTitle: string, goal: string, sessions: { letter: string, title: string, duration_estimate: number }[]): Promise<void> {
    const db = await getDBConnection();
    const programId = `PROG_${Date.now()}`;
    
    await db.runAsync('UPDATE WorkoutPrograms SET is_active = 0');

    await db.runAsync(
      'INSERT INTO WorkoutPrograms (id, title, goal, is_active) VALUES (?, ?, ?, ?)',
      [programId, programTitle, goal, 1]
    );

    for (const [index, s] of sessions.entries()) {
      await db.runAsync(
        'INSERT INTO WorkoutSessions (id, program_id, letter, title, duration_estimate) VALUES (?, ?, ?, ?, ?)',
        [`SESS_${Date.now()}_${index}`, programId, s.letter, s.title, s.duration_estimate]
      );
    }
    
    // Ao criar um novo programa em modo QUEUE, a gente pode querer limpar o histórico V3 
    // ou apenas deixar o novo rodízio assumir. Vamos deixar o rodízio assumir.
  }

  // == HYBRID SCHEDULING API ==
  static async getWeeklySchedule(): Promise<DaySchedule[]> {
    const db = await getDBConnection();
    const mode = await this.getSchedulingMode();
    const activeProgram = await this.getActiveProgram();
    
    if (!activeProgram || activeProgram.sessions.length === 0) {
      return getBlankWeek();
    }

    if (mode === 'queue') {
      const sessions = activeProgram.sessions;
      const week = getBlankWeek();
      
      // Lógica de Fila Simples: 
      // Hoje (index 3) é o próximo na sequência. 
      // Por enquanto, vamos apenas girar o carrossel.
      return week.map((day, i) => {
        // Rotaciona as sessões (A, B, C, A, B...)
        const sessionIndex = i % sessions.length;
        const session = sessions[sessionIndex];
        
        return {
          ...day,
          workout: {
            id: session.id,
            title: `Treino ${session.letter}`,
            type: session.title,
            duration: `${session.duration_estimate} min`
          }
        };
      });
    }

    // fallback calendar (legado v3 por enquanto)
    const rows: any[] = await db.getAllAsync('SELECT * FROM WorkoutV3 ORDER BY CAST(id AS INTEGER) ASC');
    if (rows.length === 0) return getBlankWeek();
    
    return rows.map(row => ({
      id: row.id,
      day: row.day,
      date: row.date,
      status: row.status as DaySchedule['status'],
      workout: row.workout_data ? JSON.parse(row.workout_data) : null,
    }));
  }

  static async updateDayStatus(id: string, newStatus: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('UPDATE WorkoutV3 SET status = ? WHERE id = ?', [newStatus, id]);
  }
}
