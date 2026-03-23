import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- IMPORTS DOS COMPONENTES ---
import { SmartEditModal } from '../../../../components/common/SmartEditModal';
import { ChallengeModal } from '../../../../components/workout/active/ChallengeModal';
import { ExerciseCard } from '../../../../components/workout/active/ExerciseCard';
import { ExerciseHistoryModal } from '../../../../components/workout/active/ExerciseHistoryModal';
import { ExerciseInfoModal } from '../../../../components/workout/active/ExerciseInfoModal';
import { ExerciseMapModal } from '../../../../components/workout/active/ExerciseMapModal';
import { FinishWorkoutModal } from '../../../../components/workout/active/FinishWorkoutModal';
import { MusicWidget } from '../../../../components/workout/active/MusicWidget';
import { ProofModal } from '../../../../components/workout/active/ProofModal';
import { RestOverlay } from '../../../../components/workout/active/RestOverlay';
import { WorkoutTimer } from '../../../../components/workout/active/WorkoutTimer';

const { width } = Dimensions.get('window');

// IMAGEM PREMIUM
const HERO_IMAGE = "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

// --- DESAFIO DO DIA ---
const DAILY_CHALLENGE = "Tire uma foto fazendo um 'Hang Loose' 🤙 ao lado do aparelho!";

// --- DADOS MOCKADOS TREINO ---
const INITIAL_WORKOUT_DATA = {
  id: 'B',
  title: 'Costas, Bíceps & Trapézio',
  exercises: [
    {
      id: 1,
      name: "Puxada Alta (Polia)",
      sets: [
        { id: 1, prev_weight: 45, prev_reps: 12, target_reps: 12 },
        { id: 2, prev_weight: 50, prev_reps: 10, target_reps: 10 },
        { id: 3, prev_weight: 55, prev_reps: 8, target_reps: 8 },
      ]
    },
    { id: 2, name: "Remada Curvada", sets: [{ id: 1, prev_weight: 60, prev_reps: 10, target_reps: 10 }] },
    { id: 3, name: "Rosca Direta", sets: [{ id: 1, prev_weight: 12, prev_reps: 12, target_reps: 12 }] }
  ]
};

const EXERCISE_INSTRUCTIONS = {
  gifUrl: "https://image.tuasaude.com/media/article/gj/wg/exercicios-para-biceps-e-triceps_30542.gif?width=686&height=487",
  difficulty: "Intermediário",
  primaryMuscle: "Grande Dorsal",
  secondaryMuscles: ["Bíceps", "Trapézio"],
  steps: ["Sente-se e prenda os joelhos.", "Segure a barra aberta.", "Puxe até o peito.", "Controle a volta."],
  mistake: "Não balance o tronco para trás."
};

const CURRENT_SONG = { title: "Can't Be Touched", artist: "Roy Jones Jr.", cover: "https://i.scdn.co/image/ab67616d0000b2733f52a707a2a072d9e69c0d9c", duration: 216 };

const EXERCISE_HISTORY = [
  { date: '01/Out', weight: 38, reps: 12 },
  { date: '08/Out', weight: 40, reps: 12 },
  { date: '15/Out', weight: 42, reps: 10 },
  { date: '22/Out', weight: 42, reps: 12 },
  { date: '29/Out', weight: 45, reps: 8 },
];

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // PERMISSÃO CÂMERA
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // ESCONDER A TAB BAR
  useLayoutEffect(() => {
    navigation.setOptions({ tabBarStyle: { display: 'none' } });
    return () => { navigation.setOptions({ tabBarStyle: undefined }); };
  }, [navigation]);

  const [isPlaying, setIsPlaying] = useState(true);
  const activeTrack = CURRENT_SONG;
  const isPlayerReady = true;

  const [workoutData, setWorkoutData] = useState(INITIAL_WORKOUT_DATA);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [inputData, setInputData] = useState<any>({});
  const [inputErrors, setInputErrors] = useState<any>({});

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  const [proofImages, setProofImages] = useState<{ [key: number]: string }>({});
  const [viewingProofIndex, setViewingProofIndex] = useState<number | null>(null);

  const [editingCell, setEditingCell] = useState<{
    exIndex: number, setIndex: number, field: 'weight' | 'reps', currentValue: string
  } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTime > 0) interval = setInterval(() => setRestTime(t => t - 1), 1000);
    else if (restTime === 0 && isResting) setIsResting(false);
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const toggleSet = (exIndex: number, setIndex: number) => {
    const key = `${exIndex}-${setIndex}`;
    const currentEntry = inputData[key] || {};
    const currentStatus = currentEntry.completed || false;

    if (currentStatus) {
      setInputData((prev: any) => ({ ...prev, [key]: { ...prev[key], completed: false } }));
      setIsResting(false);
      return;
    }

    if (!currentEntry.weight || !currentEntry.reps) {
      setInputErrors((prev: any) => ({ ...prev, [key]: true }));
      return;
    }

    setInputErrors((prev: any) => { const newErrors = { ...prev }; delete newErrors[key]; return newErrors; });
    setInputData((prev: any) => ({ ...prev, [key]: { ...prev[key], completed: true } }));
    setRestTime(60);
    setIsResting(true);
  };

  const openSmartEditor = (exIndex: number, setIndex: number, field: 'weight' | 'reps', ghostValue: number) => {
    const key = `${exIndex}-${setIndex}`;
    const val = inputData[key]?.[field] ? inputData[key][field] : ghostValue.toString();
    setEditingCell({ exIndex, setIndex, field, currentValue: val });
  };

  const saveSmartEdit = (newValue: string) => {
    if (!editingCell) return;
    const { exIndex, setIndex, field } = editingCell;
    const key = `${exIndex}-${setIndex}`;
    setInputData((prev: any) => ({ ...prev, [key]: { ...prev[key], [field]: newValue } }));
    if (inputErrors[key]) {
      setInputErrors((prev: any) => { const newErrors = { ...prev }; delete newErrors[key]; return newErrors; });
    }
    setEditingCell(null);
  };

  const adjustSmartValue = (delta: number) => {
    if (!editingCell) return;
    const currentNum = parseFloat(editingCell.currentValue) || 0;
    const newNum = Math.max(0, currentNum + delta);
    const formatted = Math.round(newNum * 100) / 100;
    setEditingCell({ ...editingCell, currentValue: formatted.toString() });
  };

  const goToExercise = (index: number) => {
    if (index >= 0 && index < workoutData.exercises.length) {
      setCurrentExerciseIndex(index);
      setIsMapOpen(false);
    }
  };

  const checkExerciseCompletion = (exIndex: number) => {
    const exercise = workoutData.exercises[exIndex];
    return exercise.sets.every((_, setIdx) => inputData[`${exIndex}-${setIdx}`]?.completed);
  };

  const handleAddSet = () => {
    const newWorkoutData = { ...workoutData };
    const exercise = newWorkoutData.exercises[currentExerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet = {
      id: lastSet.id + 1,
      prev_weight: lastSet.prev_weight,
      prev_reps: lastSet.prev_reps,
      target_reps: lastSet.target_reps
    };
    exercise.sets.push(newSet);
    setWorkoutData(newWorkoutData);
  };

  const handleOpenChallenge = () => setIsChallengeOpen(true);

  // --- CÂMERA DO DESAFIO (MODAL) ---
  const handleTakeProofPhoto = async () => {
    setIsChallengeOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Permissão de câmera necessária.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 5] });
    if (!result.canceled) {
      setProofImages(prev => ({ ...prev, [currentExerciseIndex]: result.assets[0].uri }));
    }
  };

  const handleDeleteProof = () => {
    setProofImages(prev => {
      const newState = { ...prev };
      delete newState[viewingProofIndex!];
      return newState;
    });
    setViewingProofIndex(null);
  };

  // --- FINALIZAR TREINO ---
  const handleFinishWorkout = () => setIsFinishModalOpen(true);

  const confirmFinish = () => {
    setIsFinishModalOpen(false);
    router.push('/workout/summary');
  };

  const currentExercise = workoutData.exercises[currentExerciseIndex];
  const currentProof = proofImages[currentExerciseIndex];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        hidden={isMapOpen || isHistoryOpen || isInfoOpen || !!editingCell || viewingProofIndex !== null || isChallengeOpen || isFinishModalOpen || isCameraOpen}
      />

      <View style={styles.heroContainer}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
        <View style={styles.heroOverlay} />
      </View>

      <WorkoutTimer
        elapsedTime={elapsedTime}
        exercises={workoutData.exercises}
        currentExerciseIndex={currentExerciseIndex}
        checkExerciseCompletion={checkExerciseCompletion}
        onFinish={handleFinishWorkout}
        topInset={insets.top}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} style={styles.scrollContainer} bounces={false}>
        <View style={{ height: 20 }} />

        <ExerciseCard
          exercise={currentExercise}
          index={currentExerciseIndex}
          totalExercises={workoutData.exercises.length}
          inputData={inputData}
          inputErrors={inputErrors}
          proofImage={currentProof}
          onOpenProof={() => setViewingProofIndex(currentExerciseIndex)}
          onOpenChallenge={handleOpenChallenge}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenInfo={() => setIsInfoOpen(true)}
          onOpenSmartEditor={(setIndex, field, value) => openSmartEditor(currentExerciseIndex, setIndex, field, value)}
          onToggleSet={(setIndex) => toggleSet(currentExerciseIndex, setIndex)}
          onAddSet={handleAddSet}
        />
      </ScrollView>

      {/* --- MODAIS --- */}

      <ProofModal
        visible={viewingProofIndex !== null}
        imageUri={viewingProofIndex !== null ? proofImages[viewingProofIndex] : null}
        onClose={() => setViewingProofIndex(null)}
        onDelete={handleDeleteProof}
      />

      <ChallengeModal
        visible={isChallengeOpen}
        challengeText={DAILY_CHALLENGE}
        onClose={() => setIsChallengeOpen(false)}
        onAccept={handleTakeProofPhoto}
      />

      <SmartEditModal
        visible={!!editingCell}
        field={editingCell?.field || 'weight'}
        currentValue={editingCell?.currentValue || ''}
        onClose={() => setEditingCell(null)}
        onSave={saveSmartEdit}
        onChangeText={(text) => setEditingCell(prev => prev ? { ...prev, currentValue: text } : null)}
        onAdjust={adjustSmartValue}
      />

      <FinishWorkoutModal
        visible={isFinishModalOpen}
        setsCompleted={Object.keys(inputData).length}
        onClose={() => setIsFinishModalOpen(false)}
        onConfirm={confirmFinish}
        bottomInset={insets.bottom}
      />

      {/* MUSIC WIDGET */}
      {isPlayerReady && activeTrack && (
        <MusicWidget
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          track={activeTrack}
          bottomInset={insets.bottom}
        />
      )}

      {/* BOTTOM NAV EXERCISES */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={[styles.navBtn, currentExerciseIndex === 0 && styles.navBtnDisabled]} disabled={currentExerciseIndex === 0} onPress={() => goToExercise(currentExerciseIndex - 1)}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={currentExerciseIndex === 0 ? "#E5E7EB" : "#191511"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapBtn} onPress={() => setIsMapOpen(true)}>
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#FFFFFF" />
          <Text style={styles.mapBtnText}>LISTA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]} onPress={() => { if (currentExerciseIndex < workoutData.exercises.length - 1) { goToExercise(currentExerciseIndex + 1); } else { handleFinishWorkout(); } }}>
          <MaterialCommunityIcons name={currentExerciseIndex < workoutData.exercises.length - 1 ? "chevron-right" : "flag-checkered"} size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      <RestOverlay
        isVisible={isResting}
        restTime={restTime}
        onAdd30s={() => setRestTime(t => t + 30)}
        onSkip={() => setIsResting(false)}
        bottomInset={insets.bottom}
      />

      <ExerciseMapModal
        visible={isMapOpen}
        exercises={workoutData.exercises}
        currentExerciseIndex={currentExerciseIndex}
        onClose={() => setIsMapOpen(false)}
        onSelectExercise={goToExercise}
        checkExerciseCompletion={checkExerciseCompletion}
        bottomInset={insets.bottom}
      />

      <ExerciseHistoryModal
        visible={isHistoryOpen}
        exerciseName={currentExercise.name}
        history={EXERCISE_HISTORY}
        onClose={() => setIsHistoryOpen(false)}
        bottomInset={insets.bottom}
      />

      <ExerciseInfoModal
        visible={isInfoOpen}
        exerciseName={currentExercise.name}
        instructions={EXERCISE_INSTRUCTIONS}
        onClose={() => setIsInfoOpen(false)}
        bottomInset={insets.bottom}
      />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#191511' },
  heroContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 350, zIndex: 0 },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  scrollContainer: { flex: 1, marginTop: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  navBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  navBtnPrimary: { backgroundColor: '#191511' },
  navBtnDisabled: { opacity: 0.3 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#191511', paddingHorizontal: 20, height: 50, borderRadius: 25, gap: 8 },
  mapBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
});