import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// --- IMPORTS DOS COMPONENTES ---
import HistoryCalendarModal from '../../../components/HistoryCalendarModal';
import { ExtraActivityCard } from '../../../components/workout/home/ExtraActivityCard';
import { WeeklyTimeline } from '../../../components/workout/home/WeeklyTimeline';
import { ProgramHeader } from './components/ProgramHeader';
import { RecoverModal } from './components/RecoverModal';
import { WorkoutCarouselCard } from './components/WorkoutCarouselCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;

// --- DADOS ---
const CURRENT_PROGRAM = { name: "Projeto Verão 2025", phase: "Fase 2: Hipertrofia", week: 4, total_weeks: 12 };
const WEEK_SCHEDULE = [
  { id: '1', day: 'DOM', date: '23', status: 'rest', workout: null },
  { id: '2', day: 'SEG', date: '24', status: 'completed', workout: { title: 'Peito, Ombros & Tríceps', type: 'Push', id: 'A', duration: '58 min' } },
  { id: '3', day: 'TER', date: '25', status: 'skipped', workout: { title: 'Costas & Bíceps', type: 'Pull', id: 'B', duration: '60 min' } },
  { id: '4', day: 'QUA', date: '26', status: 'today', workout: { title: 'Pernas Completo', type: 'Legs', id: 'C', duration: '70 min', kcal: '500' } },
  { id: '5', day: 'QUI', date: '27', status: 'future', workout: { title: 'Peito & Tríceps (Foco Força)', type: 'Push B', id: 'A2', duration: '55 min' } },
  { id: '6', day: 'SEX', date: '28', status: 'future', workout: { title: 'Costas & Trapézio', type: 'Pull B', id: 'B2', duration: '60 min' } },
  { id: '7', day: 'SÁB', date: '29', status: 'future', workout: { title: 'Cardio & Abs', type: 'Active Rest', id: 'CR', duration: '40 min' } },
];
const INITIAL_INDEX = 3;

export default function WorkoutScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_INDEX);

  const [selectedSkippedWorkout, setSelectedSkippedWorkout] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleDayPress = (index: number) => {
    setSelectedIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setSelectedIndex(viewableItems[0].index);
  }).current;

  const handleCardPress = (item: any) => {
    if (item.status === 'completed') {
      router.push({ pathname: '/workout/details', params: { id: 'default', date: `Dia ${item.date}` } });
    } else if (item.status === 'today') {
      router.push('/workout/active');
    } else if (item.status === 'skipped') {
      setSelectedSkippedWorkout(item);
    } else {
      alert(`Detalhes Futuros: ${item.workout.title}`);
    }
  };

  const handleRecoverAction = (action: string) => {
    console.log(`Action: ${action}`);
    alert("Ação registrada com sucesso!");
    setSelectedSkippedWorkout(null);
  };

  return (
    <View style={styles.container}>
      {/* StatusBar deve ser visível aqui, pois temos Header Nativo */}
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0, paddingTop: 0 }}>

        <View style={styles.headerContainer}>
          <ProgramHeader
            programName={CURRENT_PROGRAM.name}
            week={CURRENT_PROGRAM.week}
            totalWeeks={CURRENT_PROGRAM.total_weeks}
          />
        </View>

        <WeeklyTimeline
          schedule={WEEK_SCHEDULE}
          selectedIndex={selectedIndex}
          onDayPress={handleDayPress}
          onCalendarPress={() => setIsHistoryModalOpen(true)}
        />

        <ExtraActivityCard onPress={() => alert('Modal Esporte')} />

        <View style={styles.carouselSection}>
          <View style={styles.carouselHeader}><Text style={styles.sectionTitle}>Agenda de Treinos</Text></View>
          <FlatList
            ref={flatListRef}
            data={WEEK_SCHEDULE}
            renderItem={({ item }) => <WorkoutCarouselCard item={item} onPress={() => handleCardPress(item)} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            getItemLayout={(data, index) => ({ length: SNAP_INTERVAL, offset: SNAP_INTERVAL * index, index })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            initialScrollIndex={INITIAL_INDEX}
          />
        </View>
      </ScrollView>

      <RecoverModal
        visible={!!selectedSkippedWorkout}
        item={selectedSkippedWorkout}
        onClose={() => setSelectedSkippedWorkout(null)}
        onAction={handleRecoverAction}
      />

      <HistoryCalendarModal
        visible={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerContainer: { padding: 20, paddingBottom: 0 },
  carouselSection: {},
  carouselHeader: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
});