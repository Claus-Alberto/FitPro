import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutService } from '../src/features/workout/services/WorkoutService';

const { width } = Dimensions.get('window');

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** @description Mapeia o status real gravado no WorkoutV3 (completed/skipped/today/future) para o estilo done/missed/today usado neste calendário. */
const toCalendarStatus = (status: string) => {
  if (status === 'completed') return 'done';
  if (status === 'skipped') return 'missed';
  if (status === 'today') return 'today';
  return null;
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function HistoryCalendarModal({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDateInfo, setSelectedDateInfo] = useState<any>(null);
  const [monthHistory, setMonthHistory] = useState<Record<string, { status: string; title: string }>>({});

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12

  useEffect(() => {
    if (!visible) return;
    WorkoutService.getMonthHistory(year, month).then(setMonthHistory).catch(() => setMonthHistory({}));
  }, [visible]);

  const renderCalendarDays = () => {
    const days = [];
    const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 (dom) a 6 (sáb)
    const totalDays = new Date(year, month, 0).getDate();

    for (let i = 0; i < firstWeekday; i++) {
      days.push({ id: `empty-${i}`, type: 'empty' });
    }
    for (let i = 1; i <= totalDays; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${dayStr}`;
      const real = monthHistory[fullDate];
      const historyItem = real ? { id: fullDate, status: toCalendarStatus(real.status), title: real.title } : undefined;
      days.push({ id: fullDate, day: i, type: 'day', data: historyItem });
    }
    return days;
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <View style={[styles.calendarModalContent, { paddingBottom: insets.bottom + 20 }]}>
          {/* HEADER */}
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonthTitle}>{MONTH_NAMES[month - 1]} {year}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBg}>
              <MaterialCommunityIcons name="close" size={24} color="#191511" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
              {/* DIAS DA SEMANA */}
              <View style={styles.weekDaysRow}>
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <Text key={i} style={styles.weekDayText}>{d}</Text>
                ))}
              </View>
              
              {/* GRID */}
              <View style={styles.daysGrid}>
                {renderCalendarDays().map((item, index) => {
                  if (item.type === 'empty') return <View key={index} style={styles.dayCell} />;
                  
                  let bg = 'transparent'; 
                  let textCol = '#191511'; 
                  let border = 'transparent';

                  if (item.data?.status === 'done') { bg = '#008E00'; textCol = '#FFF'; }
                  else if (item.data?.status === 'missed') { bg = '#FEE2E2'; textCol = '#EF4444'; }
                  else if (item.data?.status === 'today') { border = '#008E00'; }

                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.dayCell]} 
                      onPress={() => setSelectedDateInfo({ day: item.day, ...item.data })}
                    >
                      <View style={[styles.dayCircle, { backgroundColor: bg, borderColor: border, borderWidth: border !== 'transparent' ? 2 : 0 }]}>
                        <Text style={[styles.dayNumber, { color: textCol }]}>{item.day}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* RESUMO DO DIA */}
              <View style={styles.selectedDayCard}>
                {selectedDateInfo ? (
                  <>
                    <Text style={styles.selectedDayTitle}>Dia {selectedDateInfo.day} de {MONTH_NAMES[month - 1]}</Text>
                    <View style={styles.selectedDayRow}>
                        <View style={[styles.statusDot, { backgroundColor: selectedDateInfo.status === 'done' ? '#008E00' : selectedDateInfo.status === 'missed' ? '#EF4444' : '#9CA3AF' }]} />
                        <Text style={styles.selectedDayWorkout}>{selectedDateInfo.title || "Sem registro"}</Text>
                    </View>
                    {selectedDateInfo.status === 'done' && (
                      <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => {
                        onClose();
                        router.push({ pathname: '/workout/details', params: { date: selectedDateInfo.id } });
                      }}>
                        <Text style={styles.viewDetailsText}>Ver Detalhes do Treino</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={styles.placeholderText}>Toque em um dia para ver detalhes</Text>
                )}
              </View>
              
              <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  calendarModalContent: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    paddingHorizontal: 24,
    paddingTop: 24,
    maxHeight: '85%', // Altura flexível
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  calendarMonthTitle: { fontSize: 22, fontWeight: '800', color: '#191511' },
  closeIconBg: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  weekDayText: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', width: 30, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  dayCell: { width: width / 8.5, height: width / 8.5, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dayNumber: { fontSize: 14, fontWeight: '700', color: '#374151' },
  selectedDayCard: { marginTop: 20, backgroundColor: '#F9FAFB', padding: 20, borderRadius: 16, alignItems: 'center' },
  selectedDayTitle: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 8 },
  selectedDayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  selectedDayWorkout: { fontSize: 18, fontWeight: '800', color: '#191511' },
  placeholderText: { color: '#9CA3AF', fontStyle: 'italic' },
  viewDetailsBtn: { marginTop: 16, backgroundColor: '#191511', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, gap: 8, width: '100%' },
  viewDetailsText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});