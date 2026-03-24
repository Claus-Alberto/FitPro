import { useRouter } from 'expo-router';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- IMPORTS DOS COMPONENTES ---
import HistoryCalendarModal from '../../../../components/HistoryCalendarModal';
import { ExtraActivityCard } from '../../../../components/workout/home/ExtraActivityCard';
import { WeeklyTimeline } from '../../../../components/workout/home/WeeklyTimeline';
import { ProgramHeader } from '../components/ProgramHeader';
import { RecoverModal } from '../components/RecoverModal';
import { WorkoutCarouselCard } from '../components/WorkoutCarouselCard';
import { useWorkout, INITIAL_INDEX } from '../hooks/useWorkout';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;



export default function WorkoutScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<any>>(null);
  const {
    program,
    schedule,
    isLoading,
    schedulingMode,
    toggleSchedulingMode,
    selectedIndex,
    setSelectedIndex,
    selectedSkippedWorkout,
    setSelectedSkippedWorkout,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    updateWorkoutStatus
  } = useWorkout();

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
          {program ? (
            <ProgramHeader 
              programName={program.name} 
              week={program.week} 
              totalWeeks={program.total_weeks} 
              schedulingMode={schedulingMode}
              onToggleMode={toggleSchedulingMode}
              onEditPress={() => router.push('/(tabs)/workout/create')}
            />
          ) : (
            <TouchableOpacity 
              style={styles.emptyCard} 
              onPress={() => router.push('/(tabs)/workout/create')}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyLabel}>COMECE AGORA</Text>
                <Text style={styles.emptyTitle}>Forje sua primeira ficha</Text>
              </View>
              <MaterialCommunityIcons name="plus-circle" size={32} color="#008E00" />
            </TouchableOpacity>
          )}
        </View>

        <WeeklyTimeline
          schedule={schedule}
          selectedIndex={selectedIndex}
          onDayPress={handleDayPress}
          onCalendarPress={() => setIsHistoryModalOpen(true)}
        />

        <ExtraActivityCard onPress={() => alert('Modal Esporte')} />

        <View style={styles.carouselSection}>
          <View style={styles.carouselHeader}><Text style={styles.sectionTitle}>Agenda de Treinos</Text></View>
          
          {isLoading || schedule.length === 0 ? (
            <View style={{ height: SNAP_INTERVAL, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FF6E00" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={schedule}
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
          )}
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
  headerContainer: { padding: 20, paddingBottom: 12 },
  carouselSection: {},
  carouselHeader: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
  emptyCard: { 
    backgroundColor: '#191511', 
    borderRadius: 20, 
    padding: 24, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 142, 0, 0.3)'
  },
  emptyLabel: { color: '#008E00', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
});