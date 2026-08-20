import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseInfoModal } from '../../../../components/workout/active/ExerciseInfoModal';
import { COLORS, SPACING } from '../../../constants/theme';
import { ExerciseMediaService } from '../services/ExerciseMediaService';
import { ExerciseLibraryEntry, WorkoutService } from '../services/WorkoutService';

/**
 * @description Monta o objeto `instructions` aceito pelo `ExerciseInfoModal` a partir de uma
 * entrada do catálogo — mesmo padrão usado em `ActiveWorkoutScreen`: sem `steps`/`mistake`
 * (o dataset só tem passo-a-passo em inglês, fora de escopo traduzir aqui) e com as fotos de
 * demonstração do `ExerciseMediaService` quando há correspondência.
 */
const buildInstructions = (entry: ExerciseLibraryEntry) => ({
  images: ExerciseMediaService.getImageUrls(entry.id),
  difficulty: null,
  primaryMuscle: entry.target_pt,
  secondaryMuscles: entry.secondary_muscles_pt,
  steps: [],
  mistake: null,
});

/**
 * @description Categorias (body_part) traduzidas — mesmas 10 usadas na base de exercícios,
 * exibidas como chips de filtro. "Todos" limpa o filtro.
 */
const BODY_PARTS_PT: { label: string; value: string | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Peito', value: 'Peito' },
  { label: 'Costas', value: 'Costas' },
  { label: 'Ombros', value: 'Ombros' },
  { label: 'Braços (Superior)', value: 'Braços (Superior)' },
  { label: 'Braços (Inferior)', value: 'Braços (Inferior)' },
  { label: 'Pernas (Superior)', value: 'Pernas (Superior)' },
  { label: 'Pernas (Inferior)', value: 'Pernas (Inferior)' },
  { label: 'Abdômen', value: 'Abdômen' },
  { label: 'Cardio', value: 'Cardio' },
  { label: 'Pescoço', value: 'Pescoço' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (entry: ExerciseLibraryEntry) => void;
}

/**
 * @description Buscador de exercícios sobre o catálogo público (exercises-dataset, MIT),
 * traduzido pra pt-BR. Usado ao montar uma ficha de treino, no lugar de só digitar o nome
 * na mão — mas a digitação livre continua disponível pra exercícios fora do catálogo.
 */
export function ExercisePickerModal({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<string | null>(null);
  const [results, setResults] = useState<ExerciseLibraryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [infoEntry, setInfoEntry] = useState<ExerciseLibraryEntry | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setIsLoading(true);
    const handle = setTimeout(async () => {
      try {
        const data = await WorkoutService.searchExerciseLibrary(query, bodyPart || undefined);
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250); // pequeno debounce pra não buscar a cada tecla
    return () => { cancelled = true; clearTimeout(handle); };
  }, [visible, query, bodyPart]);

  useEffect(() => {
    if (!visible) { setQuery(''); setBodyPart(null); }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Buscar Exercício</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar" accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={22} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ex: Supino, Agachamento, Rosca..."
            placeholderTextColor={COLORS.gray400}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </View>

        {/* ScrollView simples em vez de FlatList: são só 11 chips fixos, não precisa de
            virtualização — e a FlatList horizontal estava cortando o texto dos chips no topo
            (altura calculada de forma inconsistente entre o chip ativo e os inativos). */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsList} contentContainerStyle={styles.chipsRow}>
          {BODY_PARTS_PT.map((item) => {
            const active = bodyPart === item.value;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setBodyPart(item.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.centerBox}><ActivityIndicator color={COLORS.primary} /></View>
        ) : results.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="magnify-close" size={32} color={COLORS.gray200} style={styles.centerBoxIcon} />
            <Text style={styles.emptyText}>Nenhum exercício encontrado.</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => onSelect(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{item.name_pt}</Text>
                  <View style={styles.resultTagsRow}>
                    <View style={styles.tag}><Text style={styles.tagText}>{item.body_part_pt}</Text></View>
                    <View style={[styles.tag, styles.tagMuscle]}><Text style={[styles.tagText, styles.tagMuscleText]}>{item.target_pt}</Text></View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setInfoEntry(item)}
                  style={styles.infoBtn}
                  hitSlop={8}
                  accessibilityLabel={`Ver demonstração de ${item.name_pt}`}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.gray500} />
                </TouchableOpacity>
                <MaterialCommunityIcons name="plus-circle" size={26} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <ExerciseInfoModal
        visible={!!infoEntry}
        exerciseName={infoEntry?.name_pt || ''}
        instructions={infoEntry ? buildInstructions(infoEntry) : {}}
        onClose={() => setInfoEntry(null)}
        bottomInset={insets.bottom}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },
  // `gap` evitado de propósito (bug documentado) — espaçamento via marginRight no ícone de busca.
  searchRow: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.xl, backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 14, paddingHorizontal: 14, height: 50, marginBottom: 14 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, color: COLORS.secondary },
  // FlatList horizontal precisa de altura própria explícita — sem isso, em alguns Androids o
  // layout inicial "achatava" os chips (cortando o texto no topo) antes do primeiro re-layout.
  // O padding embaixo do texto tem que ficar FORA da FlatList (num wrapper), porque um
  // `paddingBottom` dentro do contentContainerStyle é conteúdo roláveis — some do espaço
  // disponível pra altura do próprio chip em vez de virar respiro depois dele.
  // flexShrink: 0 é o pulo do gato aqui — sem ele, o flexbox espremia esse ScrollView pra
  // uma fração da altura pedida (virou ~10px em vez de 48px), porque o irmão de baixo
  // (a FlatList de resultados, com flex:1) "puxava" espaço e o layout encolhia este primeiro
  // pra caber, cortando o topo de cada chip.
  chipsList: { flexGrow: 0, flexShrink: 0, height: 48, marginBottom: SPACING.lg },
  chipsRow: { paddingHorizontal: SPACING.xl, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: SPACING.sm, borderRadius: 20, backgroundColor: COLORS.gray100, marginRight: SPACING.sm },
  chipActive: { backgroundColor: COLORS.secondary },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.gray500 },
  chipTextActive: { color: COLORS.white },
  // `gap` evitado de propósito — espaçamento via marginBottom no ícone (ver `centerBoxIcon`).
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerBoxIcon: { marginBottom: SPACING.sm },
  emptyText: { color: COLORS.gray400, fontWeight: '600' },
  resultRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.gray100 },
  resultName: { fontSize: 15, fontWeight: '700', color: COLORS.secondary, marginBottom: 6, textTransform: 'capitalize' },
  // `gap` evitado de propósito — espaçamento via marginRight na própria `tag` (ver abaixo).
  resultTagsRow: { flexDirection: 'row' },
  infoBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.sm, marginRight: 10 },
  tag: { backgroundColor: COLORS.gray200, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: 8, marginRight: 6 },
  tagText: { fontSize: 11, fontWeight: '600', color: COLORS.gray500 },
  tagMuscle: { backgroundColor: COLORS.successLight },
  tagMuscleText: { color: COLORS.primary },
});
