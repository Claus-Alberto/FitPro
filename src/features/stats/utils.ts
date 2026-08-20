/**
 * @description Formata uma data ISO 'YYYY-MM-DD' como 'DD/MM', sem depender do locale do
 * dispositivo — usado no eixo X dos gráficos de linha/barra da tela de Estatísticas.
 */
export const formatShortDatePt = (iso: string): string => {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  if (!m || !d) return iso;
  return `${d}/${m}`;
};

/** @description Formata um `Date` para 'YYYY-MM-DD' (mesma chave usada em todo o schema). */
export const toISODate = (d: Date): string => d.toISOString().slice(0, 10);
