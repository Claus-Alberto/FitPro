import { getDBConnection } from '../../../database/db';
import { DaySchedule } from '../hooks/useWorkout';

const DAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Janela da timeline semanal: 5 dias de histórico + hoje + 1 dia de prévia (só o "amanhã"),
// em vez de mostrar 3 dias de prévia futura — a fila de rotação repete o mesmo treino até
// avançar, então prever 3 dias à frente só mostrava o mesmo treino repetido sem utilidade.
// Exportado porque `useWorkout.INITIAL_INDEX` precisa saber em qual posição do array de 7
// dias "hoje" cai, pra abrir o carrossel da aba Treino já centralizado nele.
export const PAST_DAYS_WINDOW = 5;

/** @description Formata um Date para 'YYYY-MM-DD' (chave de dia usada em todo o schema). */
const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

// O BLANK_SEED agora só define a estrutura básica de dias para quando não há nada no log.
const getBlankWeek = (): DaySchedule[] => {
  const today = new Date();

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - PAST_DAYS_WINDOW + i);
    return {
      id: `day_${i}`,
      day: DAY_LABELS[d.getDay()],
      date: d.getDate().toString(),
      status: i === PAST_DAYS_WINDOW ? 'today' : (i < PAST_DAYS_WINDOW ? 'skipped' : 'future'),
      workout: null
    };
  });
};

export interface ExerciseDefinition {
  name: string;
  target_sets: number;
  target_reps: number;
  library_id?: string | null;
}

export interface ExerciseLibraryEntry {
  id: string;
  name_en: string;
  name_pt: string;
  body_part: string;
  body_part_pt: string;
  equipment: string;
  equipment_pt: string;
  target_pt: string;
  muscle_group_pt: string;
  secondary_muscles_pt: string[];
  steps_en: string[];
}

export interface SessionInput {
  letter: string;
  title: string;
  duration_estimate: number;
  exercises?: ExerciseDefinition[];
}

export interface SetLogInput {
  exerciseName: string;
  setIndex: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export class WorkoutService {
  static async seedInitialData(): Promise<void> {
    // Não vamos mais seedar dados fakes no WorkoutV3.
    // O banco deve começar limpo para o usuário criar sua própria ficha.
  }

  // == PREFERENCES API ==
  static async getSchedulingMode(): Promise<'calendar' | 'queue'> {
    const db = await getDBConnection();
    // Chave passada como parâmetro (?) em vez de aspas duplas no SQL: aspas duplas denotam
    // identificador em SQL padrão — o SQLite nativo tem um fallback tolerante que trata como
    // string literal quando não bate com nenhuma coluna, mas isso não é garantido no driver
    // wa-sqlite usado no alvo web, então o binding evita essa ambiguidade nos dois ambientes.
    const result: any = await db.getFirstAsync('SELECT value FROM UserPreferences WHERE key = ?', ['schedulingMode']);
    return (result?.value as 'calendar' | 'queue') || 'queue';
  }

  static async setSchedulingMode(mode: 'calendar' | 'queue'): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('UPDATE UserPreferences SET value = ? WHERE key = ?', [mode, 'schedulingMode']);
  }

  static async getQueueCursor(): Promise<number> {
    const db = await getDBConnection();
    const result: any = await db.getFirstAsync('SELECT value FROM UserPreferences WHERE key = ?', ['queueCursor']);
    return parseInt(result?.value ?? '0', 10) || 0;
  }

  static async advanceQueueCursor(): Promise<void> {
    const db = await getDBConnection();
    const current = await this.getQueueCursor();
    await db.runAsync('UPDATE UserPreferences SET value = ? WHERE key = ?', [String(current + 1), 'queueCursor']);
  }

  // == PROGRAMS API ==
  static async getActiveProgram(): Promise<any> {
    const db = await getDBConnection();
    const program: any = await db.getFirstAsync('SELECT * FROM WorkoutPrograms WHERE is_active = 1');
    if (!program) return null;

    const sessions = await db.getAllAsync('SELECT * FROM WorkoutSessions WHERE program_id = ? ORDER BY letter ASC', [program.id]);

    // Semana atual do programa: calculada a partir de quando a ficha foi criada,
    // em vez de fixa em "1 de 12" como no mock original.
    let week = 1;
    const totalWeeks = program.total_weeks || 12;
    if (program.created_at) {
      const createdAt = new Date(program.created_at);
      const daysSince = Math.floor((Date.now() - createdAt.getTime()) / MS_PER_DAY);
      week = Math.min(totalWeeks, Math.max(1, Math.floor(daysSince / 7) + 1));
    }

    return { ...program, sessions, week, total_weeks: totalWeeks };
  }

  static async saveNewProgram(programTitle: string, goal: string, sessions: SessionInput[]): Promise<void> {
    const db = await getDBConnection();
    const programId = `PROG_${Date.now()}`;

    await db.runAsync('UPDATE WorkoutPrograms SET is_active = 0');

    await db.runAsync(
      'INSERT INTO WorkoutPrograms (id, title, goal, is_active, total_weeks, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [programId, programTitle, goal, 1, 12, new Date().toISOString()]
    );

    for (const [index, s] of sessions.entries()) {
      const sessionId = `SESS_${Date.now()}_${index}`;
      await db.runAsync(
        'INSERT INTO WorkoutSessions (id, program_id, letter, title, duration_estimate) VALUES (?, ?, ?, ?, ?)',
        [sessionId, programId, s.letter, s.title, s.duration_estimate]
      );

      for (const [exIndex, ex] of (s.exercises || []).entries()) {
        await db.runAsync(
          'INSERT INTO WorkoutExercises (id, session_id, name, order_index, target_sets, target_reps, library_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [`EX_${Date.now()}_${index}_${exIndex}`, sessionId, ex.name, exIndex, ex.target_sets || 3, ex.target_reps || 12, ex.library_id || null]
        );
      }
    }

    // Reseta o cursor da fila: a nova ficha começa do treino A.
    await db.runAsync('UPDATE UserPreferences SET value = ? WHERE key = ?', ['0', 'queueCursor']);
  }

  static async getSessionExercises(sessionId: string): Promise<{ id: string, name: string, target_sets: number, target_reps: number, library_id: string | null }[]> {
    const db = await getDBConnection();
    return db.getAllAsync('SELECT * FROM WorkoutExercises WHERE session_id = ? ORDER BY order_index ASC', [sessionId]);
  }

  /** @description Lista todas as fichas (ativa e passadas) com contagem de treinos/exercícios, mais recente primeiro. */
  static async getAllPrograms(): Promise<any[]> {
    const db = await getDBConnection();
    const programs: any[] = await db.getAllAsync('SELECT * FROM WorkoutPrograms ORDER BY is_active DESC, created_at DESC');

    const result = [];
    for (const program of programs) {
      const sessions: any[] = await db.getAllAsync('SELECT id FROM WorkoutSessions WHERE program_id = ?', [program.id]);
      let exerciseCount = 0;
      for (const s of sessions) {
        const row: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM WorkoutExercises WHERE session_id = ?', [s.id]);
        exerciseCount += row?.count || 0;
      }
      result.push({ ...program, sessionCount: sessions.length, exerciseCount });
    }
    return result;
  }

  /** @description Carrega uma ficha específica (por id) com todas as divisões e exercícios, para a tela de edição. */
  static async getProgramById(programId: string): Promise<any | null> {
    const db = await getDBConnection();
    const program: any = await db.getFirstAsync('SELECT * FROM WorkoutPrograms WHERE id = ?', [programId]);
    if (!program) return null;

    const sessions: any[] = await db.getAllAsync('SELECT * FROM WorkoutSessions WHERE program_id = ? ORDER BY letter ASC', [programId]);
    for (const session of sessions) {
      session.exercises = await this.getSessionExercises(session.id);
    }

    return { ...program, sessions };
  }

  /**
   * @description Atualiza uma ficha já existente: renomeia o programa e substitui por completo suas
   * divisões/exercícios (apaga as antigas via CASCADE e regrava as atuais), sem mexer em
   * `is_active`/`created_at`/no cursor da fila — diferente de `saveNewProgram`, que sempre cria
   * um programa novo e reseta a fila.
   */
  static async updateProgram(programId: string, programTitle: string, goal: string, sessions: SessionInput[]): Promise<void> {
    const db = await getDBConnection();

    await db.runAsync('UPDATE WorkoutPrograms SET title = ?, goal = ? WHERE id = ?', [programTitle, goal, programId]);
    // FK `WorkoutSessions.program_id -> WorkoutPrograms` está com ON DELETE CASCADE e
    // `PRAGMA foreign_keys = ON` (ver ensureSchema em db.ts), então apagar as sessões também
    // apaga os WorkoutExercises delas automaticamente.
    await db.runAsync('DELETE FROM WorkoutSessions WHERE program_id = ?', [programId]);

    for (const [index, s] of sessions.entries()) {
      const sessionId = `SESS_${Date.now()}_${index}`;
      await db.runAsync(
        'INSERT INTO WorkoutSessions (id, program_id, letter, title, duration_estimate) VALUES (?, ?, ?, ?, ?)',
        [sessionId, programId, s.letter, s.title, s.duration_estimate]
      );

      for (const [exIndex, ex] of (s.exercises || []).entries()) {
        await db.runAsync(
          'INSERT INTO WorkoutExercises (id, session_id, name, order_index, target_sets, target_reps, library_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [`EX_${Date.now()}_${index}_${exIndex}`, sessionId, ex.name, exIndex, ex.target_sets || 3, ex.target_reps || 12, ex.library_id || null]
        );
      }
    }
  }

  /** @description Torna uma ficha passada a ficha ativa novamente, reiniciando a fila a partir do Treino A. */
  static async activateProgram(programId: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('UPDATE WorkoutPrograms SET is_active = 0');
    await db.runAsync('UPDATE WorkoutPrograms SET is_active = 1 WHERE id = ?', [programId]);
    await db.runAsync('UPDATE UserPreferences SET value = ? WHERE key = ?', ['0', 'queueCursor']);
  }

  /** @description Apaga uma ficha (e suas divisões/exercícios, via CASCADE) permanentemente. */
  static async deleteProgram(programId: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM WorkoutPrograms WHERE id = ?', [programId]);
  }

  // == BIBLIOTECA DE EXERCÍCIOS (base pública, seedada uma vez) ==

  /** @description Seeda o catálogo de exercícios uma única vez (idempotente — checa contagem antes). */
  static async seedExerciseLibrary(): Promise<void> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM ExerciseLibrary');
    if ((row?.count || 0) > 0) return;

    // Import tardio: só carrega o JSON (~870KB) quando de fato precisa seedar.
    const exercises: any[] = require('../../../data/exercises.json');

    const BATCH_SIZE = 40;
    for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
      const batch = exercises.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const params: any[] = [];
      for (const e of batch) {
        params.push(
          e.id, e.name_en, e.name_pt,
          e.body_part, e.body_part_pt,
          e.equipment, e.equipment_pt,
          e.target_pt, e.muscle_group_pt,
          JSON.stringify(e.secondary_muscles_pt || []),
          JSON.stringify(e.steps_en || [])
        );
      }
      await db.runAsync(
        `INSERT OR IGNORE INTO ExerciseLibrary
         (id, name_en, name_pt, body_part, body_part_pt, equipment, equipment_pt, target_pt, muscle_group_pt, secondary_muscles_pt, steps_en)
         VALUES ${placeholders}`,
        params
      );
    }
  }

  /** @description Busca no catálogo por nome (pt ou en) e/ou filtro de parte do corpo. Limitado a 60 resultados. */
  static async searchExerciseLibrary(query: string, bodyPart?: string): Promise<ExerciseLibraryEntry[]> {
    const db = await getDBConnection();
    const like = `%${query.trim()}%`;
    const rows: any[] = bodyPart
      ? await db.getAllAsync(
          'SELECT * FROM ExerciseLibrary WHERE (name_pt LIKE ? OR name_en LIKE ?) AND body_part_pt = ? ORDER BY name_pt ASC LIMIT 60',
          [like, like, bodyPart]
        )
      : await db.getAllAsync(
          'SELECT * FROM ExerciseLibrary WHERE name_pt LIKE ? OR name_en LIKE ? ORDER BY name_pt ASC LIMIT 60',
          [like, like]
        );
    return rows.map(this.hydrateLibraryEntry);
  }

  static async getExerciseLibraryEntry(id: string): Promise<ExerciseLibraryEntry | null> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync('SELECT * FROM ExerciseLibrary WHERE id = ?', [id]);
    return row ? this.hydrateLibraryEntry(row) : null;
  }

  private static hydrateLibraryEntry(row: any): ExerciseLibraryEntry {
    return {
      ...row,
      secondary_muscles_pt: row.secondary_muscles_pt ? JSON.parse(row.secondary_muscles_pt) : [],
      steps_en: row.steps_en ? JSON.parse(row.steps_en) : [],
    };
  }

  static async getSessionById(sessionId: string): Promise<any | null> {
    const db = await getDBConnection();
    return db.getFirstAsync('SELECT * FROM WorkoutSessions WHERE id = ?', [sessionId]);
  }

  /**
   * @description Busca, para um exercício pelo nome, a última série registrada de cada posição
   * (set_index) em treinos concluídos anteriormente — usado como "fantasma" (prev_weight/prev_reps)
   * na tela de treino ativo, em vez do peso fixo que existia no mock.
   */
  static async getLastPerformance(exerciseName: string): Promise<{ set_index: number, weight: number, reps: number }[]> {
    const db = await getDBConnection();
    return db.getAllAsync(
      `SELECT sl.set_index, sl.weight, sl.reps FROM SetLogs sl
       JOIN WorkoutLogs wl ON wl.id = sl.log_id
       WHERE sl.exercise_name = ? AND sl.completed = 1
       ORDER BY wl.date DESC, sl.set_index ASC`,
      [exerciseName]
    );
  }

  /**
   * @description Resolve qual sessão (Treino A/B/C...) deve ser feita numa data, seguindo o
   * cursor real da fila (avança apenas quando um treino é de fato concluído).
   */
  static async resolveSessionForOffset(offsetFromCursor: number): Promise<any | null> {
    const program = await this.getActiveProgram();
    if (!program || program.sessions.length === 0) return null;
    const cursor = await this.getQueueCursor();
    const idx = (cursor + offsetFromCursor) % program.sessions.length;
    return program.sessions[(idx + program.sessions.length) % program.sessions.length];
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
      return this.getQueueWeek(activeProgram);
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

  /**
   * @description Monta a semana (hoje -5 a hoje +1) em modo "fila real": qualquer dia com
   * WorkoutV3 já gravado (concluído/pulado) usa o que está no banco; o slot de "hoje" é sempre
   * reservado no banco para poder ser completado depois; dias futuros são apenas uma prévia da
   * rotação (não persistem até chegarem).
   */
  private static async getQueueWeek(activeProgram: any): Promise<DaySchedule[]> {
    const db = await getDBConnection();
    const today = new Date();
    const todayISO = toISODate(today);

    // Qualquer dia que ficou marcado como "today" em execuções anteriores e não é mais hoje
    // vira "skipped" (o usuário não fez e o dia já passou).
    await db.runAsync("UPDATE WorkoutV3 SET status = 'skipped' WHERE status = 'today' AND date != ?", [todayISO]);

    // Garante que o slot de hoje existe no banco, para sempre haver algo concreto a completar.
    const existingToday: any = await db.getFirstAsync('SELECT * FROM WorkoutV3 WHERE date = ?', [todayISO]);
    if (!existingToday) {
      const todaysSession = await this.resolveSessionForOffset(0);
      if (todaysSession) {
        await db.runAsync(
          'INSERT INTO WorkoutV3 (id, day, date, status, workout_data) VALUES (?, ?, ?, ?, ?)',
          [todayISO, DAY_LABELS[today.getDay()], todayISO, 'today', JSON.stringify({
            id: todaysSession.id,
            letter: todaysSession.letter,
            title: `Treino ${todaysSession.letter}`,
            type: todaysSession.title,
            duration: `${todaysSession.duration_estimate} min`,
          })]
        );
      }
    }

    const days: DaySchedule[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - PAST_DAYS_WINDOW + i);
      const iso = toISODate(d);

      const row: any = await db.getFirstAsync('SELECT * FROM WorkoutV3 WHERE date = ?', [iso]);
      if (row) {
        days.push({
          id: row.date,
          day: row.day,
          date: d.getDate().toString(),
          status: row.status,
          workout: row.workout_data ? JSON.parse(row.workout_data) : null,
        });
        continue;
      }

      if (iso < todayISO) {
        // Passado sem registro: pode ser um dia sem ficha ativa ainda, ou um dia em que o app
        // simplesmente não foi aberto (sem 'today' pra virar 'skipped' depois) — não dá pra
        // provar que havia algo agendado, então `workout: null` aqui faz a Home tratar como
        // "sem registro" (neutro) em vez de "falhou" (vermelho), mesmo marcando o status como
        // 'skipped' internamente.
        days.push({ id: iso, day: DAY_LABELS[d.getDay()], date: d.getDate().toString(), status: 'skipped', workout: null });
      } else {
        // Futuro: só uma prévia da rotação, ainda não gravada.
        const offset = Math.round((d.getTime() - today.getTime()) / MS_PER_DAY);
        const session = await this.resolveSessionForOffset(offset);
        days.push({
          id: iso,
          day: DAY_LABELS[d.getDay()],
          date: d.getDate().toString(),
          status: 'future',
          workout: session ? {
            id: session.id,
            letter: session.letter,
            title: `Treino ${session.letter}`,
            type: session.title,
            duration: `${session.duration_estimate} min`,
          } : null,
        });
      }
    }
    return days;
  }

  static async updateDayStatus(id: string, newStatus: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('UPDATE WorkoutV3 SET status = ? WHERE id = ?', [newStatus, id]);
  }

  // == WORKOUT LOGGING API (treino ativo -> histórico real) ==

  /**
   * @description Persiste um treino concluído: grava o WorkoutLog + cada SetLog, marca o dia
   * como 'completed' no WorkoutV3 e avança o cursor da fila. Substitui os dados fixos que
   * existiam em ActiveWorkoutScreen/WorkoutSummaryScreen/WorkoutDetailScreen.
   */
  static async completeWorkout(params: {
    date: string;
    sessionId?: string;
    sessionTitle: string;
    durationSeconds: number;
    sets: SetLogInput[];
    photos?: string[];
  }): Promise<{ logId: string; totalVolumeKg: number }> {
    const db = await getDBConnection();
    const logId = `LOG_${params.date}`;

    const totalVolumeKg = params.sets
      .filter(s => s.completed)
      .reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);

    await db.runAsync('DELETE FROM SetLogs WHERE log_id = ?', [logId]);
    await db.runAsync('DELETE FROM WorkoutLogs WHERE id = ?', [logId]);

    await db.runAsync(
      'INSERT INTO WorkoutLogs (id, date, session_title, duration_seconds, total_volume_kg, photos, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [logId, params.date, params.sessionTitle, params.durationSeconds, totalVolumeKg, JSON.stringify(params.photos || []), new Date().toISOString()]
    );

    for (const s of params.sets) {
      await db.runAsync(
        'INSERT INTO SetLogs (id, log_id, exercise_name, set_index, weight, reps, completed) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`${logId}_${s.exerciseName}_${s.setIndex}`, logId, s.exerciseName, s.setIndex, s.weight, s.reps, s.completed ? 1 : 0]
      );
    }

    const existing: any = await db.getFirstAsync('SELECT day FROM WorkoutV3 WHERE date = ?', [params.date]);
    const day = existing?.day || DAY_LABELS[new Date(params.date).getDay()];

    // `id` aqui é só a letra da divisão (A/B/C) pro badge redondo do card — igual ao formato
    // usado pra dias "hoje"/"futuro". `logId` é a chave real de busca do log, guardada à parte
    // (antes os dois estavam no mesmo campo `id`, e o card mostrava o log id inteiro no lugar
    // da letra, quebrando o layout).
    const session = params.sessionId ? await this.getSessionById(params.sessionId) : null;
    await db.runAsync(
      'INSERT OR REPLACE INTO WorkoutV3 (id, day, date, status, workout_data) VALUES (?, ?, ?, ?, ?)',
      [params.date, day, params.date, 'completed', JSON.stringify({
        id: session?.letter || '✓',
        letter: session?.letter || '✓',
        logId,
        title: params.sessionTitle,
        type: session?.title || params.sessionTitle,
        duration: session ? `${session.duration_estimate} min` : undefined,
        // Volume do dia (kg), carregado aqui além de `WorkoutLogs.total_volume_kg` só pra
        // `getMonthHistory()` conseguir devolver uma intensidade real pro heatmap de
        // Consistência da tela de Estatísticas sem precisar de uma query extra por dia.
        volumeKg: totalVolumeKg,
      })]
    );

    await this.advanceQueueCursor();

    return { logId, totalVolumeKg };
  }

  /** @description Busca o treino real (log + séries) de uma data específica, para as telas de detalhe/histórico. */
  static async getWorkoutLogByDate(date: string): Promise<any | null> {
    const db = await getDBConnection();
    const log: any = await db.getFirstAsync('SELECT * FROM WorkoutLogs WHERE date = ?', [date]);
    if (!log) return null;
    return this.hydrateLog(log);
  }

  static async getWorkoutLogById(logId: string): Promise<any | null> {
    const db = await getDBConnection();
    const log: any = await db.getFirstAsync('SELECT * FROM WorkoutLogs WHERE id = ?', [logId]);
    if (!log) return null;
    return this.hydrateLog(log);
  }

  private static async hydrateLog(log: any): Promise<any> {
    const db = await getDBConnection();
    const setRows: any[] = await db.getAllAsync('SELECT * FROM SetLogs WHERE log_id = ? ORDER BY exercise_name, set_index ASC', [log.id]);

    const exerciseMap = new Map<string, any>();
    for (const row of setRows) {
      if (!exerciseMap.has(row.exercise_name)) {
        exerciseMap.set(row.exercise_name, { id: row.exercise_name, name: row.exercise_name, sets: [] });
      }
      exerciseMap.get(row.exercise_name).sets.push({
        id: row.set_index + 1, // set_index é salvo em base 0; exibido pro usuário em base 1 (Série 1, 2, 3...)
        weight: row.weight,
        reps: row.reps,
        completed: !!row.completed,
      });
    }

    const durationMin = Math.round((log.duration_seconds || 0) / 60);

    return {
      id: log.id,
      date: log.date,
      title: log.session_title,
      duration: `${durationMin} min`,
      total_volume: `${(log.total_volume_kg || 0).toFixed(1)} kg`,
      photos: log.photos ? JSON.parse(log.photos) : [],
      exercises: Array.from(exerciseMap.values()),
    };
  }

  /**
   * @description Conta quantos dias seguidos (terminando no mais recente dia já decidido —
   * 'today' não conta, ainda está em aberto) foram 'completed', andando pra trás a partir do
   * registro mais recente até achar o primeiro 'skipped'. Usado pelo streak da Home.
   */
  static async getCurrentStreak(): Promise<number> {
    const db = await getDBConnection();
    const rows: any[] = await db.getAllAsync(
      "SELECT status FROM WorkoutV3 WHERE status IN ('completed','skipped') ORDER BY date DESC"
    );
    let streak = 0;
    for (const row of rows) {
      if (row.status !== 'completed') break;
      streak++;
    }
    return streak;
  }

  /**
   * @description Status real (concluído/pulado/hoje) por data de um mês, para o calendário de
   * histórico. `volumeKg` vem do `workout_data.volumeKg` gravado em `completeWorkout()` — pode vir
   * `undefined` em dias 'skipped'/'future' (nunca tiveram log) ou em treinos concluídos antes dessa
   * coluna existir no JSON; quem consome isso (ex: heatmap de Consistência) já trata esse caso.
   */
  static async getMonthHistory(year: number, month1to12: number): Promise<Record<string, { status: string; title: string; volumeKg?: number }>> {
    const db = await getDBConnection();
    const prefix = `${year}-${String(month1to12).padStart(2, '0')}-`;
    const rows: any[] = await db.getAllAsync("SELECT * FROM WorkoutV3 WHERE date LIKE ?", [`${prefix}%`]);
    const map: Record<string, { status: string; title: string; volumeKg?: number }> = {};
    for (const row of rows) {
      const data = row.workout_data ? JSON.parse(row.workout_data) : null;
      map[row.date] = { status: row.status, title: data?.title || data?.type || '', volumeKg: data?.volumeKg };
    }
    return map;
  }

  // == ESTATÍSTICAS REAIS (Stats/Conquistas) ==

  /** @description Volume total (kg) por semana (segunda a segunda), últimas `weeks` semanas com dado. */
  static async getWeeklyVolume(weeks: number = 8): Promise<{ weekLabel: string; volumeKg: number }[]> {
    const db = await getDBConnection();
    const rows: any[] = await db.getAllAsync('SELECT date, total_volume_kg FROM WorkoutLogs ORDER BY date ASC');
    const buckets = new Map<string, number>();
    for (const row of rows) {
      const d = new Date(row.date);
      const day = d.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(d);
      monday.setDate(d.getDate() - diffToMonday);
      const key = toISODate(monday);
      buckets.set(key, (buckets.get(key) || 0) + (row.total_volume_kg || 0));
    }
    const sortedKeys = [...buckets.keys()].sort().slice(-weeks);
    return sortedKeys.map((key) => ({ weekLabel: key, volumeKg: Math.round(buckets.get(key)!) }));
  }

  /**
   * @description Volume total levantado por grupo muscular (`body_part_pt`), a partir dos sets
   * realmente completados. Junta `SetLogs.exercise_name` (texto livre) com `WorkoutExercises.name`
   * pra achar o `library_id` — dedupa por nome ANTES de agregar (uma linha nome->library_id) pra
   * não inflar o volume caso o mesmo nome exista em várias fichas/sessões ao longo do tempo.
   */
  static async getMuscleBalance(): Promise<{ bodyPart: string; volume: number }[]> {
    const db = await getDBConnection();
    const nameToLibrary: any[] = await db.getAllAsync(
      'SELECT name, library_id FROM WorkoutExercises WHERE library_id IS NOT NULL GROUP BY name'
    );
    if (nameToLibrary.length === 0) return [];
    const nameMap = new Map(nameToLibrary.map((r) => [r.name, r.library_id]));

    const sets: any[] = await db.getAllAsync('SELECT exercise_name, weight, reps FROM SetLogs WHERE completed = 1');
    const volumeByLibraryId = new Map<string, number>();
    for (const s of sets) {
      const libId = nameMap.get(s.exercise_name);
      if (!libId) continue;
      volumeByLibraryId.set(libId, (volumeByLibraryId.get(libId) || 0) + (s.weight || 0) * (s.reps || 0));
    }
    if (volumeByLibraryId.size === 0) return [];

    const ids = [...volumeByLibraryId.keys()];
    const placeholders = ids.map(() => '?').join(',');
    const libs: any[] = await db.getAllAsync(`SELECT id, body_part_pt FROM ExerciseLibrary WHERE id IN (${placeholders})`, ids);

    const bodyPartVolume = new Map<string, number>();
    for (const lib of libs) {
      const vol = volumeByLibraryId.get(lib.id) || 0;
      bodyPartVolume.set(lib.body_part_pt, (bodyPartVolume.get(lib.body_part_pt) || 0) + vol);
    }
    return [...bodyPartVolume.entries()].map(([bodyPart, volume]) => ({ bodyPart, volume: Math.round(volume) }));
  }

  /** @description Recorde pessoal (maior peso já levantado, completado) por exercício, mais recente entre empates. */
  static async getPersonalRecords(limit: number = 20): Promise<{ exerciseName: string; maxWeight: number; reps: number; date: string }[]> {
    const db = await getDBConnection();
    const rows: any[] = await db.getAllAsync(`
      SELECT sl.exercise_name, sl.weight, sl.reps, wl.date
      FROM SetLogs sl JOIN WorkoutLogs wl ON wl.id = sl.log_id
      WHERE sl.completed = 1 AND sl.weight IS NOT NULL
      ORDER BY sl.weight DESC, wl.date DESC
    `);
    const seen = new Map<string, any>();
    for (const r of rows) {
      if (!seen.has(r.exercise_name)) seen.set(r.exercise_name, r);
    }
    return [...seen.values()].slice(0, limit).map((r) => ({ exerciseName: r.exercise_name, maxWeight: r.weight, reps: r.reps, date: r.date }));
  }

  /** @description Números agregados de todo o histórico — base pra badges de conquistas (total de treinos, volume total, treinos antes das 6h). */
  static async getLifetimeStats(): Promise<{ totalWorkouts: number; totalVolumeKg: number; firstWorkoutDate: string | null; earlyMorningCount: number }> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync('SELECT COUNT(*) as count, COALESCE(SUM(total_volume_kg),0) as vol, MIN(date) as first FROM WorkoutLogs');
    const morningRow: any = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM WorkoutLogs WHERE completed_at IS NOT NULL AND CAST(strftime('%H', completed_at) AS INTEGER) < 6"
    );
    return {
      totalWorkouts: row?.count || 0,
      totalVolumeKg: Math.round(row?.vol || 0),
      firstWorkoutDate: row?.first || null,
      earlyMorningCount: morningRow?.count || 0,
    };
  }

  /**
   * @description Peso máximo levantado (série completada) por treino, ao longo do tempo, para um
   * exercício específico — alimenta o gráfico de evolução de um recorde pessoal (`LineChart`) na
   * tela de Conquistas. Um ponto por data de treino (não por série), usando o maior peso do dia.
   */
  static async getExerciseWeightHistory(exerciseName: string): Promise<{ date: string; value: number }[]> {
    const db = await getDBConnection();
    const rows: any[] = await db.getAllAsync(
      `SELECT wl.date as date, MAX(sl.weight) as value
       FROM SetLogs sl JOIN WorkoutLogs wl ON wl.id = sl.log_id
       WHERE sl.exercise_name = ? AND sl.completed = 1 AND sl.weight IS NOT NULL
       GROUP BY wl.date
       ORDER BY wl.date ASC`,
      [exerciseName]
    );
    return rows.map((r) => ({ date: r.date, value: r.value }));
  }

  /**
   * @description Checa se existe algum treino concluído numa data de calendário fixa (mês/dia),
   * em qualquer ano — usado pelas medalhas sazonais com data fixa (ex: treino no Natal, 25/12).
   * @param monthDay Data no formato 'MM-DD', ex: '12-25'.
   */
  static async hasCompletedWorkoutOnCalendarDate(monthDay: string): Promise<boolean> {
    const db = await getDBConnection();
    const row: any = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM WorkoutLogs WHERE strftime('%m-%d', date) = ?",
      [monthDay]
    );
    return (row?.count || 0) > 0;
  }

  /**
   * @description Checa se TODOS os dias de um intervalo (inclusive) estão marcados como
   * 'completed' no WorkoutV3 — usado pela medalha sazonal "Ano Novo, Vida Nova" (streak completa
   * na primeira semana de Janeiro). Intervalo pequeno e fixo (ex: 7 dias), não uma streak genérica.
   */
  static async hasCompletedStreakInRange(startDate: string, endDate: string): Promise<boolean> {
    const db = await getDBConnection();
    const rows: any[] = await db.getAllAsync(
      "SELECT date FROM WorkoutV3 WHERE date BETWEEN ? AND ? AND status = 'completed'",
      [startDate, endDate]
    );
    const daysInRange = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / MS_PER_DAY) + 1;
    return daysInRange > 0 && rows.length >= daysInRange;
  }
}
