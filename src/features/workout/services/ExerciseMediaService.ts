const MEDIA_MAP: Record<string, string[]> = require('../../../data/exercise_media.json');

const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

/**
 * @description Imagens de demonstração (início/fim do movimento) por exercício, quando disponíveis.
 * Fonte: `free-exercise-db` (yuhonas, Unlicense/domínio público) — escolhida especificamente porque
 * o dataset de exercícios original deste app (`exercises-dataset`, usado pros nomes/categorias em
 * `src/data/exercises.json`) tem sua mídia (fotos/gifs) sob © Gym Visual, com licença separada que
 * exigiria autorização própria — ver comentário em `ExerciseLibrary` (db.ts) e em `ExerciseInfoModal`.
 * `src/data/exercise_media.json` mapeia por correspondência de nome (exata ou por contenção de
 * palavras) os ids do catálogo local pros ids do free-exercise-db — cobertura parcial (~296 de 1324
 * exercícios), e ocasionalmente aponta pra uma variante próxima em vez do exercício exato quando o
 * nome não bate 100%. As imagens não são empacotadas no app — carregadas sob demanda direto do
 * GitHub (permitido pela licença), então precisam de rede pra aparecer.
 */
export class ExerciseMediaService {
  /** @description URLs das imagens de demonstração de um exercício (pelo id do catálogo local), ou array vazio se não houver correspondência. */
  static getImageUrls(exerciseLibraryId: string): string[] {
    const paths = MEDIA_MAP[exerciseLibraryId];
    if (!paths || paths.length === 0) return [];
    return paths.map((p) => `${BASE_URL}${encodeURI(p)}`);
  }

  static hasMedia(exerciseLibraryId: string): boolean {
    return !!MEDIA_MAP[exerciseLibraryId]?.length;
  }
}
