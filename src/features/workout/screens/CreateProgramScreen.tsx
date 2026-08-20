import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseInfoModal } from '../../../../components/workout/active/ExerciseInfoModal';
import { COLORS, SPACING } from '../../../constants/theme';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { ExerciseMediaService } from '../services/ExerciseMediaService';
import { ExerciseLibraryEntry, WorkoutService } from '../services/WorkoutService';

/**
 * @description Monta o objeto `instructions` aceito pelo `ExerciseInfoModal` a partir de uma
 * entrada do catálogo — mesmo padrão usado em `ActiveWorkoutScreen`/`ExercisePickerModal`.
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
 * @description Tela para criar OU editar um Template de Ficha de Treino (Program).
 * Em modo edição (recebe `programId` via querystring), carrega a ficha existente do banco
 * e regrava suas divisões/exercícios ao salvar, em vez de sempre criar uma ficha nova —
 * antes esta tela só sabia criar, então o botão de editar a ficha atual efetivamente criava
 * uma segunda ficha do zero.
 */
interface SessionDraft {
  letter: string;
  title: string;
  duration_estimate: number;
  exercises: { name: string; target_sets: number; target_reps: number; library_id?: string | null }[];
}

const getBlankSessions = (): SessionDraft[] => [
  { letter: 'A', title: 'Peito, Ombro e Tríceps', duration_estimate: 45, exercises: [] },
  { letter: 'B', title: 'Costas e Bíceps', duration_estimate: 45, exercises: [] }
];

export default function CreateProgramScreen() {
  const { programId: rawProgramId } = useLocalSearchParams<{ programId?: string }>();
  // "new" é o sentinel usado por quem navega pra cá pedindo uma ficha em branco (ver
  // ManageProgramsScreen) — precisa de um valor não-vazio porque o React Navigation faz merge
  // dos params novos sobre os antigos numa Tabs.Screen já visitada, então uma string vazia (ou
  // ausência de `programId` no objeto de params) não é suficiente pra sobrescrever/limpar um
  // `programId` real deixado por uma navegação anterior de edição.
  const programId = rawProgramId && rawProgramId !== 'new' ? rawProgramId : undefined;
  const isEditMode = !!programId;

  const [isLoadingProgram, setIsLoadingProgram] = useState(isEditMode);
  const [wasActiveProgram, setWasActiveProgram] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<'Hipertrofia' | 'Secar'>('Hipertrofia');
  const [sessions, setSessions] = useState<SessionDraft[]>(getBlankSessions());
  const [exerciseDraft, setExerciseDraft] = useState<Record<number, string>>({});
  const [pickerSessionIndex, setPickerSessionIndex] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const [infoExerciseName, setInfoExerciseName] = useState('');
  const [infoEntry, setInfoEntry] = useState<ExerciseLibraryEntry | null>(null);
  const [loadingInfoKey, setLoadingInfoKey] = useState<string | null>(null);

  // `workout/create` é uma Tabs.Screen "oculta", não uma rota empilhada de verdade — navegar pra
  // ela de novo (ex: "Editar" numa ficha, depois "+ Nova Ficha" na lista) reaproveita a MESMA
  // instância montada em vez de criar uma nova, então um `useEffect` de mount único deixava o
  // formulário preso nos dados da edição anterior. `useFocusEffect` recarrega (ou limpa, se não
  // há mais `programId`) toda vez que a tela ganha foco, garantindo que reflita o modo atual.
  useFocusEffect(
    useCallback(() => {
      if (!programId) {
        setIsLoadingProgram(false);
        setWasActiveProgram(false);
        setName('');
        setGoal('Hipertrofia');
        setSessions(getBlankSessions());
        setExerciseDraft({});
        return;
      }

      let cancelled = false;
      setIsLoadingProgram(true);
      (async () => {
        try {
          const program = await WorkoutService.getProgramById(programId);
          if (cancelled) return;
          if (!program) {
            Alert.alert('Ops!', 'Essa ficha não foi encontrada.');
            router.replace('/(tabs)/workout/programs');
            return;
          }
          setName(program.title);
          setGoal(program.goal === 'Secar' ? 'Secar' : 'Hipertrofia');
          setWasActiveProgram(program.is_active === 1);
          setSessions(program.sessions.map((s: any) => ({
            letter: s.letter,
            title: s.title,
            duration_estimate: s.duration_estimate || 45,
            exercises: s.exercises.map((ex: any) => ({
              name: ex.name,
              target_sets: ex.target_sets || 3,
              target_reps: ex.target_reps || 12,
              library_id: ex.library_id || null,
            })),
          })));
          setExerciseDraft({});
        } catch (error) {
          if (!cancelled) {
            Alert.alert('Erro', 'Não foi possível carregar essa ficha.');
            console.error(error);
          }
        } finally {
          if (!cancelled) setIsLoadingProgram(false);
        }
      })();

      return () => { cancelled = true; };
    }, [programId])
  );

  const backTarget = isEditMode ? '/(tabs)/workout/programs' : '/(tabs)/workout';

  const handleAddSession = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLetter = letters[sessions.length] || 'X';
    setSessions([...sessions, { letter: nextLetter, title: `Treino ${nextLetter}`, duration_estimate: 45, exercises: [] }]);
  };

  const handleRemoveSession = (index: number) => {
    if (sessions.length === 1) return Alert.alert('Aviso', 'Você precisa de pelo menos 1 treino na ficha.');
    const newSessions = sessions.filter((_, i) => i !== index);
    // Renomear as letras para manter a ordem alfabética?
    // Pra manter simples, vamos apenas atualizar o estado sem re-letrecar caso ele tire do meio, ou re-letrecar (mais elegante).
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const reordered = newSessions.map((s, i) => ({ ...s, letter: letters[i] }));
    setSessions(reordered);
  };

  const handleAddExercise = (sessionIndex: number) => {
    const exerciseName = (exerciseDraft[sessionIndex] || '').trim();
    if (!exerciseName) return;
    const newSessions = [...sessions];
    newSessions[sessionIndex].exercises.push({ name: exerciseName, target_sets: 3, target_reps: 12 });
    setSessions(newSessions);
    setExerciseDraft(prev => ({ ...prev, [sessionIndex]: '' }));
  };

  const handleRemoveExercise = (sessionIndex: number, exerciseIndex: number) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].exercises = newSessions[sessionIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setSessions(newSessions);
  };

  /** @description Ajusta séries/reps de um exercício já adicionado (mín. 1 série, 1 rep). */
  const handleAdjustExercise = (sessionIndex: number, exerciseIndex: number, field: 'target_sets' | 'target_reps', delta: number) => {
    const newSessions = [...sessions];
    const ex = newSessions[sessionIndex].exercises[exerciseIndex];
    ex[field] = Math.max(1, ex[field] + delta);
    setSessions(newSessions);
  };

  /** @description Abre o modal de demonstração (fotos + músculos-alvo) de um exercício do catálogo já adicionado à ficha. */
  const handleOpenExerciseInfo = async (sessionIndex: number, exIndex: number, libraryId: string, name: string) => {
    const key = `${sessionIndex}-${exIndex}`;
    setInfoExerciseName(name);
    setLoadingInfoKey(key);
    try {
      const entry = await WorkoutService.getExerciseLibraryEntry(libraryId);
      setInfoEntry(entry);
    } finally {
      setLoadingInfoKey((current) => (current === key ? null : current));
    }
  };

  const handleSelectFromLibrary = (entry: ExerciseLibraryEntry) => {
    if (pickerSessionIndex === null) return;
    const newSessions = [...sessions];
    newSessions[pickerSessionIndex].exercises.push({ name: entry.name_pt, target_sets: 3, target_reps: 12, library_id: entry.id });
    setSessions(newSessions);
    setPickerSessionIndex(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      return Alert.alert('Ops!', 'Dê um nome inspirador para a sua nova ficha de treino.');
    }
    const sessionWithoutExercises = sessions.find(s => s.exercises.length === 0);
    if (sessionWithoutExercises) {
      return Alert.alert('Ops!', `Adicione pelo menos 1 exercício no Treino ${sessionWithoutExercises.letter}.`);
    }

    try {
      if (isEditMode && programId) {
        await WorkoutService.updateProgram(programId, name, goal, sessions);
        // Editar uma ficha que não é a ativa não deve levar de volta pra aba Treino (ela
        // continua mostrando a ficha ativa, então a mudança pareceria não ter acontecido) —
        // volta pra lista de fichas nesse caso.
        Alert.alert('Ficha Atualizada!', 'Suas alterações foram salvas.', [
          { text: 'OK', onPress: () => router.replace(wasActiveProgram ? '/(tabs)/workout' : '/(tabs)/workout/programs') }
        ]);
      } else {
        await WorkoutService.saveNewProgram(name, goal, sessions);
        Alert.alert('Ficha Forjada!', 'Sua nova rotina de treino está pronta para o combate.', [
          // `router.back()` aqui pousava na aba Social em vez de voltar pra Treino: `create` é
          // registrada como uma Tabs.Screen "escondida" (href: null), não como uma rota empilhada
          // dentro da stack da aba Treino — então back() não tem o que desempilhar e cai no
          // fallback (primeira aba registrada). Navegação explícita evita essa ambiguidade.
          { text: 'Bora Treinar', onPress: () => router.replace('/(tabs)/workout') }
        ]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um problema ao salvar no banco de dados local.');
      console.error(error);
    }
  };

  if (isLoadingProgram) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6E00" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace(backTarget)} style={styles.backButton} accessibilityLabel="Voltar" accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#191511" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Editar Ficha' : 'Forjar Nova Ficha'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>
          {isEditMode ? 'Ajuste os treinos e exercícios dessa ficha.' : 'Monte o plano perfeito para conquistar o físico que você deseja.'}
        </Text>

        {/* Seção 1: Dados Globais da Ficha */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>A Jornada</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Plano</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Projeto Monstro 2025" 
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.pillButton, goal === 'Hipertrofia' && styles.pillActive]}
              onPress={() => setGoal('Hipertrofia')}
            >
              <MaterialCommunityIcons name="weight-lifter" size={16} color={goal === 'Hipertrofia' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.pillText, goal === 'Hipertrofia' && { color: '#FFF' }]}>Hipertrofia</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.pillButton, goal === 'Secar' && styles.pillActive]}
              onPress={() => setGoal('Secar')}
            >
              <MaterialCommunityIcons name="fire" size={16} color={goal === 'Secar' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.pillText, goal === 'Secar' && { color: '#FFF' }]}>Secar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 2: Os Treinos (Dias A, B, C) */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Divisão dos Treinos</Text>
          </View>
          <Text style={styles.cardDesc}>Adicione as letras (A, B, C) que compõem o seu planejamento.</Text>

          {sessions.map((session, index) => (
            <View key={index} style={styles.sessionItem}>
              <View style={styles.letterBadge}>
                <Text style={styles.letterText}>{session.letter}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.sessionTitleInput}
                  value={session.title}
                  onChangeText={(txt) => {
                    const newSess = [...sessions];
                    newSess[index].title = txt;
                    setSessions(newSess);
                  }}
                  placeholder="Nome do Treino (Ex: Pernas)"
                />
                <Text style={styles.sessionDesc}>Tempo Est.: {session.duration_estimate} min</Text>

                {session.exercises.length > 0 && (
                  <View style={styles.exerciseList}>
                    {session.exercises.map((ex, exIndex) => (
                      <View key={exIndex} style={styles.exerciseRow}>
                        <View style={styles.exerciseRowTop}>
                          <Text style={styles.exerciseRowName} numberOfLines={2}>{ex.name}</Text>
                          {!!ex.library_id && (
                            <TouchableOpacity
                              onPress={() => handleOpenExerciseInfo(index, exIndex, ex.library_id!, ex.name)}
                              hitSlop={8}
                              style={styles.exerciseInfoBtn}
                              accessibilityLabel={`Ver demonstração de ${ex.name}`}
                              accessibilityRole="button"
                            >
                              {loadingInfoKey === `${index}-${exIndex}` ? (
                                <ActivityIndicator size="small" color={COLORS.gray500} />
                              ) : (
                                <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.gray500} />
                              )}
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity onPress={() => handleRemoveExercise(index, exIndex)} hitSlop={8}>
                            <MaterialCommunityIcons name="close" size={16} color={COLORS.gray400} />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.stepperGroupRow}>
                          <View style={styles.stepperCard}>
                            <Text style={styles.stepperLabel}>SÉRIES</Text>
                            <View style={styles.stepperControls}>
                              <TouchableOpacity onPress={() => handleAdjustExercise(index, exIndex, 'target_sets', -1)} style={styles.stepperBtn} hitSlop={6}>
                                <MaterialCommunityIcons name="minus" size={14} color={COLORS.primary} />
                              </TouchableOpacity>
                              <Text style={styles.stepperValue}>{ex.target_sets}</Text>
                              <TouchableOpacity onPress={() => handleAdjustExercise(index, exIndex, 'target_sets', 1)} style={styles.stepperBtn} hitSlop={6}>
                                <MaterialCommunityIcons name="plus" size={14} color={COLORS.primary} />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.stepperCard}>
                            <Text style={styles.stepperLabel}>REPS</Text>
                            <View style={styles.stepperControls}>
                              <TouchableOpacity onPress={() => handleAdjustExercise(index, exIndex, 'target_reps', -1)} style={styles.stepperBtn} hitSlop={6}>
                                <MaterialCommunityIcons name="minus" size={14} color={COLORS.primary} />
                              </TouchableOpacity>
                              <Text style={styles.stepperValue}>{ex.target_reps}</Text>
                              <TouchableOpacity onPress={() => handleAdjustExercise(index, exIndex, 'target_reps', 1)} style={styles.stepperBtn} hitSlop={6}>
                                <MaterialCommunityIcons name="plus" size={14} color={COLORS.primary} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.libraryBtn} onPress={() => setPickerSessionIndex(index)}>
                  <MaterialCommunityIcons name="database-search" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.libraryBtnText}>Buscar Exercício</Text>
                </TouchableOpacity>

                <View style={styles.addExerciseRow}>
                  <TextInput
                    style={styles.addExerciseInput}
                    placeholder="Ou digite um exercício personalizado"
                    placeholderTextColor={COLORS.gray400}
                    value={exerciseDraft[index] || ''}
                    onChangeText={(txt) => setExerciseDraft(prev => ({ ...prev, [index]: txt }))}
                    onSubmitEditing={() => handleAddExercise(index)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.addExerciseBtn} onPress={() => handleAddExercise(index)}>
                    <MaterialCommunityIcons name="plus" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemoveSession(index)}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addSessionButton} onPress={handleAddSession}>
            <MaterialCommunityIcons name="plus" size={20} color="#008E00" />
            <Text style={styles.addSessionText}>Adicionar Treino {sessions.length < 26 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[sessions.length] : ''}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer de Ação */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <Text style={styles.submitText}>{isEditMode ? 'SALVAR ALTERAÇÕES' : 'CRIAR MÁQUINA DE RESULTADOS'}</Text>
          <MaterialCommunityIcons name={isEditMode ? 'content-save' : 'lightning-bolt'} size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ExercisePickerModal
        visible={pickerSessionIndex !== null}
        onClose={() => setPickerSessionIndex(null)}
        onSelect={handleSelectFromLibrary}
      />

      <ExerciseInfoModal
        visible={!!infoExerciseName}
        exerciseName={infoExerciseName}
        instructions={infoEntry ? buildInstructions(infoEntry) : {}}
        onClose={() => { setInfoExerciseName(''); setInfoEntry(null); }}
        bottomInset={insets.bottom}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  container: { flexGrow: 1, backgroundColor: '#F3F4F6', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, marginBottom: 8 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
  subtitle: { fontSize: 14, color: '#4B5563', marginBottom: 24, textAlign: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#191511', marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#6B7280', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 16, color: '#191511' },
  row: { flexDirection: 'row', gap: 12 },
  pillButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pillActive: { backgroundColor: '#191511' },
  pillText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  sessionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, gap: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  letterBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#008E00', justifyContent: 'center', alignItems: 'center' },
  letterText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  sessionTitleInput: { fontSize: 14, fontWeight: '800', color: '#191511', padding: 0, margin: 0 },
  sessionDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  exerciseList: { marginTop: 10 },
  exerciseRow: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, padding: 10, marginBottom: SPACING.sm },
  exerciseRowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.sm },
  exerciseRowName: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.secondary, marginRight: SPACING.sm },
  // 32x32/ícone 20 — mesmo tamanho do botão "i" do `ExercisePickerModal`, pra manter o alvo de
  // toque consistente entre os dois lugares onde se abre a demonstração de um exercício.
  exerciseInfoBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  // Dois cartões de largura flexível (flex:1) em vez de texto inline "3x séries" — assim nunca
  // estoura a largura da tela em dispositivos reais (a versão com texto+ícones numa linha só
  // funcionava na largura do preview web, mas quebrava em telas de celular de verdade).
  // `gap` evitado de propósito (mesmo problema que quebrou o botão "Buscar Exercício" antes) —
  // espaçamento via marginRight explícito no primeiro cartão.
  stepperGroupRow: { flexDirection: 'row' },
  stepperCard: { flex: 1, backgroundColor: COLORS.gray100, borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginRight: SPACING.sm },
  stepperLabel: { fontSize: 9, fontWeight: '800', color: COLORS.gray400, letterSpacing: 0.5, marginBottom: 2 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepperBtn: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  stepperValue: { fontSize: 14, fontWeight: '800', color: COLORS.secondary, minWidth: 24, textAlign: 'center' },
  libraryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.successLight, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, marginTop: 10 },
  libraryBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  // `gap` evitado de propósito — espaçamento via marginRight no `addExerciseInput`.
  addExerciseRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  addExerciseInput: { flex: 1, minWidth: 0, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, paddingHorizontal: 10, paddingVertical: SPACING.sm, fontSize: 13, color: COLORS.secondary, marginRight: SPACING.sm },
  addExerciseBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.successLight, borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  addSessionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#008E00', borderRadius: 12 },
  addSessionText: { fontSize: 14, fontWeight: '700', color: '#008E00' },
  footer: { backgroundColor: '#FFF', padding: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  submitButton: { backgroundColor: '#FF6E00', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, shadowColor: '#FF6E00', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  submitText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
});
