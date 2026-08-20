import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// No alvo Web, expo-sqlite abre o arquivo persistente via OPFS (AccessHandlePoolVFS), que exige
// headers de isolamento cross-origin (COOP/COEP) para os "sync access handles" funcionarem sem
// travar — o servidor de dev do Metro não envia esses headers, então na prática o driver web
// trava aleatoriamente ("unable to open database file", "xFileControl" undefined, Access Handle
// já aberto). Usar ':memory:' força o expo-sqlite a usar o MemoryVFS (100% em RAM, sem OPFS),
// que não tem esse problema. Só afeta o preview Web: no nativo (iOS/Android) continua o arquivo
// físico persistente de sempre — os dados só não sobrevivem a um F5 no navegador.
const DB_NAME = Platform.OS === 'web' ? ':memory:' : 'fitpro_local.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let schemaReadyPromise: Promise<void> | null = null;

/**
 * @description Cria (se necessário) toda a estrutura de tabelas do banco local.
 * Idempotente (usa CREATE TABLE IF NOT EXISTS) — pode ser chamada quantas vezes for
 * necessário sem efeito colateral.
 */
const ensureSchema = async (db: SQLite.SQLiteDatabase): Promise<void> => {
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
        is_active INTEGER DEFAULT 0,
        total_weeks INTEGER DEFAULT 12,
        created_at TEXT
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

      -- Exercícios que compõem cada Divisão (Sessão) da ficha
      CREATE TABLE IF NOT EXISTS WorkoutExercises (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        target_sets INTEGER DEFAULT 3,
        target_reps INTEGER DEFAULT 12,
        library_id TEXT,
        FOREIGN KEY(session_id) REFERENCES WorkoutSessions(id) ON DELETE CASCADE
      );

      -- Registro real de um treino concluído (um por dia executado)
      CREATE TABLE IF NOT EXISTS WorkoutLogs (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        session_title TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        total_volume_kg REAL DEFAULT 0,
        photos TEXT
      );

      -- Séries (sets) registradas de cada exercício dentro de um WorkoutLog
      CREATE TABLE IF NOT EXISTS SetLogs (
        id TEXT PRIMARY KEY,
        log_id TEXT NOT NULL,
        exercise_name TEXT NOT NULL,
        set_index INTEGER NOT NULL,
        weight REAL,
        reps INTEGER,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY(log_id) REFERENCES WorkoutLogs(id) ON DELETE CASCADE
      );

      -- Catálogo de exercícios (base pública "exercises-dataset", MIT) usado no buscador de
      -- exercícios ao montar uma ficha. Nomes/categorias traduzidos pra pt-BR; sem mídia (fotos/
      -- gifs) porque a licença da mídia original é da Gym Visual, separada do MIT do dataset.
      CREATE TABLE IF NOT EXISTS ExerciseLibrary (
        id TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_pt TEXT NOT NULL,
        body_part TEXT,
        body_part_pt TEXT,
        equipment TEXT,
        equipment_pt TEXT,
        target_pt TEXT,
        muscle_group_pt TEXT,
        secondary_muscles_pt TEXT,
        steps_en TEXT
      );

      -- Configurações e Toggles do App
      CREATE TABLE IF NOT EXISTS UserPreferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Injeção do Padrão Premium: A engine sempre nasce em modo "Fila Infinita" (Queue)
      INSERT OR IGNORE INTO UserPreferences (key, value) VALUES ('schedulingMode', 'queue');
      -- Cursor da fila: quantos treinos da rotação (A, B, C...) já foram de fato concluídos
      INSERT OR IGNORE INTO UserPreferences (key, value) VALUES ('queueCursor', '0');

      -- Catálogo de alimentos (base pública TACO/NEPA-UNICAMP, MIT, já em pt-BR) usado no
      -- buscador de alimentos + itens criados manualmente pelo usuário (source = 'custom').
      CREATE TABLE IF NOT EXISTS Foods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        kcal_100g REAL NOT NULL DEFAULT 0,
        protein_100g REAL NOT NULL DEFAULT 0,
        carb_100g REAL NOT NULL DEFAULT 0,
        fat_100g REAL NOT NULL DEFAULT 0,
        fiber_100g REAL NOT NULL DEFAULT 0,
        sodium_100g_mg REAL NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'taco',
        barcode TEXT
      );

      -- Uma refeição (café da manhã, almoço, ou uma extra criada pelo usuário) num dia específico.
      CREATE TABLE IF NOT EXISTS Meals (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        time TEXT NOT NULL,
        icon TEXT,
        is_default INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0
      );

      -- Item de alimento dentro de uma refeição. Os macros são gravados no momento do registro
      -- (como SetLogs faz com peso/reps) para o diário histórico não mudar se o alimento em Foods
      -- for editado depois.
      CREATE TABLE IF NOT EXISTS MealItems (
        id TEXT PRIMARY KEY,
        meal_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        kcal REAL NOT NULL DEFAULT 0,
        protein REAL NOT NULL DEFAULT 0,
        carbs REAL NOT NULL DEFAULT 0,
        fat REAL NOT NULL DEFAULT 0,
        FOREIGN KEY(meal_id) REFERENCES Meals(id) ON DELETE CASCADE
      );

      -- Consumo de água por dia (um registro por data, incrementado ao longo do dia).
      CREATE TABLE IF NOT EXISTS WaterLog (
        date TEXT PRIMARY KEY,
        ml_total INTEGER NOT NULL DEFAULT 0
      );

      -- Medições corporais do usuário ao longo do tempo — peso, composição (bioimpedância) e
      -- circunferências (Medidas). Uma linha por métrica por data (não uma coluna por métrica),
      -- pra caber tanto "Evolução Corporal" quanto "Medidas" da tela de Estatísticas no mesmo
      -- modelo, sem precisar de duas tabelas quase-idênticas.
      CREATE TABLE IF NOT EXISTS BodyMetrics (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        metric TEXT NOT NULL,
        value REAL NOT NULL
      );

      -- Sessões de esporte/cardio registradas manualmente (corrida, caminhada, futebol, vôlei...).
      CREATE TABLE IF NOT EXISTS CardioLog (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        activity TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        distance_km REAL,
        kcal_estimate INTEGER
      );
    `);

  // Migração leve: `CREATE TABLE IF NOT EXISTS` não adiciona colunas novas a uma tabela que já
  // existia de uma versão anterior do app (o banco é um arquivo físico persistente no nativo —
  // não reseta a cada deploy como o :memory: do preview web). Cada coluna adicionada depois da
  // criação inicial da tabela precisa ser "migrada" assim pra quem já tinha o app instalado.
  // `ADD COLUMN` falha com "duplicate column name" se ela já existir — ignoramos esse erro
  // especificamente; qualquer outro erro real continua sendo propagado.
  const migrations = [
    'ALTER TABLE WorkoutExercises ADD COLUMN library_id TEXT',
    'ALTER TABLE WorkoutExercises ADD COLUMN target_reps INTEGER DEFAULT 12',
    'ALTER TABLE WorkoutPrograms ADD COLUMN total_weeks INTEGER DEFAULT 12',
    'ALTER TABLE WorkoutPrograms ADD COLUMN created_at TEXT',
    // Timestamp completo (não só a data) de quando o treino foi finalizado — permite achievements
    // baseados em horário (ex: treino antes das 6h), impossível de derivar só da coluna `date`.
    'ALTER TABLE WorkoutLogs ADD COLUMN completed_at TEXT',
  ];
  for (const migration of migrations) {
    try {
      await db.execAsync(migration);
    } catch (error: any) {
      if (!String(error?.message || error).includes('duplicate column name')) throw error;
    }
  }

  console.log('[SQLite] Tabelas verificadas/criadas com sucesso.');
};

/**
 * @description Obtém a conexão singleton com o banco de dados local e GARANTE que o schema
 * já foi criado antes de devolvê-la (memoizado — só roda o CREATE TABLE uma vez de verdade).
 *
 * Antes, o schema só era criado por uma chamada avulsa a `initLocalDatabase()` no boot do app
 * (`app/_layout.tsx`), enquanto todo o resto do app (WorkoutService, etc.) chamava
 * `getDBConnection()` diretamente — sem esperar essa inicialização. Em telas que rodam
 * splash/boot de forma não bloqueante (como o alvo Web, onde a splash screen nativa não
 * existe), isso cria uma corrida real: uma query pode chegar antes das tabelas existirem
 * ("no such table: WorkoutPrograms"). Centralizar a garantia aqui elimina a corrida para
 * qualquer chamador, em qualquer plataforma.
 * @returns {Promise<SQLite.SQLiteDatabase>} Instância do banco SQLite, com schema pronto.
 */
export const getDBConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  if (!schemaReadyPromise) {
    schemaReadyPromise = ensureSchema(dbInstance);
  }
  await schemaReadyPromise;
  return dbInstance;
};

/**
 * @description Inicia a estrutura de tabelas do banco de dados na primeira carga do aplicativo.
 * Mantido para compatibilidade com o boot em `app/_layout.tsx`; a garantia real agora vive em
 * `getDBConnection()`, então esta função apenas a aciona.
 * @returns {Promise<void>}
 */
export const initLocalDatabase = async (): Promise<void> => {
  await getDBConnection();
};

/**
 * @description Apaga todos os dados gerados pelo usuário (fichas, treinos concluídos, log de
 * calendário/fila, refeições/itens, água, alimentos personalizados/escaneados, metas) e devolve
 * as preferências ao padrão de instalação nova (fila, cursor zerado). Propositalmente NÃO toca em
 * `ExerciseLibrary` nem nos alimentos `source = 'taco'` — são os catálogos de referência
 * seedados automaticamente no boot, não dado gerado pelo usuário; apagá-los só forçaria um
 * reseed idêntico no próximo carregamento, sem benefício.
 * @returns {Promise<void>}
 */
export const resetUserData = async (): Promise<void> => {
  const db = await getDBConnection();
  await db.execAsync(`
    DELETE FROM WorkoutV3;
    DELETE FROM WorkoutPrograms;
    DELETE FROM WorkoutLogs;
    DELETE FROM Meals;
    DELETE FROM WaterLog;
    DELETE FROM Foods WHERE source != 'taco';
    DELETE FROM UserPreferences WHERE key IN ('goal_kcal', 'goal_protein', 'goal_carb', 'goal_fat', 'goal_water_ml');
    UPDATE UserPreferences SET value = 'queue' WHERE key = 'schedulingMode';
    UPDATE UserPreferences SET value = '0' WHERE key = 'queueCursor';
  `);
};
