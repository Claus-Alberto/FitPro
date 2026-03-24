import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * @description Obtém a conexão singleton com o banco de dados local.
 * Utiliza o método assíncrono padrão da biblioteca moderna expo-sqlite.
 * @returns {Promise<SQLite.SQLiteDatabase>} Instância do banco SQLite
 */
export const getDBConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  
  // Abre (ou cria) o banco com nome consistente
  dbInstance = await SQLite.openDatabaseAsync('fitpro_local.db');
  return dbInstance;
};

/**
 * @description Inicia a estrutura de tabelas do banco de dados na primeira carga do aplicativo.
 * Aplica PRAGMA WAL para maior performance de escrita e leitura do SQLite.
 * @returns {Promise<void>}
 */
export const initLocalDatabase = async (): Promise<void> => {
  const db = await getDBConnection();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      -- Calendário / Fila Rotativa (O Log em si)
      CREATE TABLE IF NOT EXISTS WorkoutV3 (
        id TEXT PRIMARY KEY,
        day TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        workout_data TEXT
      );

      -- Fichas de Treino (Templates)
      CREATE TABLE IF NOT EXISTS WorkoutPrograms (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        goal TEXT,
        difficulty TEXT,
        is_active INTEGER DEFAULT 0
      );

      -- Divisões do Treino (Treino A, B, C...)
      CREATE TABLE IF NOT EXISTS WorkoutSessions (
        id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        letter TEXT NOT NULL,
        title TEXT NOT NULL,
        duration_estimate INTEGER,
        FOREIGN KEY(program_id) REFERENCES WorkoutPrograms(id) ON DELETE CASCADE
      );

      -- Configurações e Toggles do App
      CREATE TABLE IF NOT EXISTS UserPreferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Injeção do Padrão Premium: A engine sempre nasce em modo "Fila Infinita" (Queue)
      INSERT OR IGNORE INTO UserPreferences (key, value) VALUES ('schedulingMode', 'queue');
    `);

  console.log('[SQLite] Tabelas verificadas/criadas com sucesso.');
};
