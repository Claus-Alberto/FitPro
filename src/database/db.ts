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

    CREATE TABLE IF NOT EXISTS WorkoutSchedule (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      workout_data TEXT
    );
  `);

  console.log('[SQLite] Tabelas verificadas/criadas com sucesso.');
};
