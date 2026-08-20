import { getDBConnection } from '../../../database/db';

/** @description Objetivo de treino selecionável na tela de Perfil. */
export type ProfileGoal = 'hypertrophy' | 'weight_loss' | 'strength';

/** @description Nível de experiência selecionável na tela de Perfil. */
export type ProfileLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  name: string;
  bio: string;
  /** Altura em metros (ex: 1.78). Null quando o usuário nunca preencheu. */
  heightM: number | null;
  age: number | null;
  goal: ProfileGoal | null;
  level: ProfileLevel | null;
  photoUri: string | null;
  coverUri: string | null;
}

const PROFILE_KEYS = {
  name: 'profile_name',
  bio: 'profile_bio',
  heightM: 'profile_height_m',
  age: 'profile_age',
  goal: 'profile_goal',
  level: 'profile_level',
  photoUri: 'profile_photo_uri',
  coverUri: 'profile_cover_uri',
} as const;

const EMPTY_PROFILE: UserProfile = {
  name: '',
  bio: '',
  heightM: null,
  age: null,
  goal: null,
  level: null,
  photoUri: null,
  coverUri: null,
};

/**
 * @description Persistência do perfil do usuário (nome, bio, altura, idade, objetivo, nível,
 * fotos de perfil/capa) em `UserPreferences`, mesmo padrão key/value já usado por
 * `schedulingMode`/metas de dieta. Peso corporal NÃO mora aqui — é responsabilidade do
 * `BodyMetricsService` (`weight_kg`), pra Home/Perfil/Estatísticas lerem a mesma fonte real.
 */
export class ProfileService {
  /** @description Lê o perfil salvo. Campos nunca preenchidos voltam vazios/null (sem mock). */
  static async getProfile(): Promise<UserProfile> {
    const db = await getDBConnection();
    const rows: any[] = await db.getAllAsync(
      `SELECT key, value FROM UserPreferences WHERE key IN (${Object.values(PROFILE_KEYS).map(() => '?').join(',')})`,
      Object.values(PROFILE_KEYS)
    );
    const map: Record<string, string> = {};
    rows.forEach((r) => { map[r.key] = r.value; });

    return {
      name: map[PROFILE_KEYS.name] ?? EMPTY_PROFILE.name,
      bio: map[PROFILE_KEYS.bio] ?? EMPTY_PROFILE.bio,
      heightM: map[PROFILE_KEYS.heightM] !== undefined ? parseFloat(map[PROFILE_KEYS.heightM]) : null,
      age: map[PROFILE_KEYS.age] !== undefined ? parseInt(map[PROFILE_KEYS.age], 10) : null,
      goal: (map[PROFILE_KEYS.goal] as ProfileGoal) ?? null,
      level: (map[PROFILE_KEYS.level] as ProfileLevel) ?? null,
      photoUri: map[PROFILE_KEYS.photoUri] ?? null,
      coverUri: map[PROFILE_KEYS.coverUri] ?? null,
    };
  }

  /** @description Grava parcialmente o perfil (só as chaves informadas são tocadas). */
  static async updateProfile(partial: Partial<UserProfile>): Promise<void> {
    const db = await getDBConnection();
    const entries: [string, string][] = [];

    if (partial.name !== undefined) entries.push([PROFILE_KEYS.name, partial.name]);
    if (partial.bio !== undefined) entries.push([PROFILE_KEYS.bio, partial.bio]);
    if (partial.heightM !== undefined && partial.heightM !== null) entries.push([PROFILE_KEYS.heightM, String(partial.heightM)]);
    if (partial.age !== undefined && partial.age !== null) entries.push([PROFILE_KEYS.age, String(partial.age)]);
    if (partial.goal !== undefined && partial.goal !== null) entries.push([PROFILE_KEYS.goal, partial.goal]);
    if (partial.level !== undefined && partial.level !== null) entries.push([PROFILE_KEYS.level, partial.level]);
    if (partial.photoUri !== undefined && partial.photoUri !== null) entries.push([PROFILE_KEYS.photoUri, partial.photoUri]);
    if (partial.coverUri !== undefined && partial.coverUri !== null) entries.push([PROFILE_KEYS.coverUri, partial.coverUri]);

    for (const [key, value] of entries) {
      await db.runAsync(
        'INSERT INTO UserPreferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        [key, value, value]
      );
    }
  }
}
