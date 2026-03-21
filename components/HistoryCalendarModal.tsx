import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

// --- DADOS MOCKADOS (Centralizados aqui) ---
const FULL_HISTORY: any = {
  '2023-11-01': { id: '2023-11-01', status: 'done', title: 'Peito & Tríceps' },
  '2023-11-02': { id: '2023-11-02', status: 'done', title: 'Costas & Bíceps' },
  '2023-11-03': { id: '2023-11-03', status: 'missed', title: 'Pernas' },
  '2023-11-04': { id: '2023-11-04', status: 'done', title: 'Ombros & Trapézio' },
  '2023-11-06': { id: '2023-11-06', status: 'done', title: 'Peito & Tríceps' },
  '2023-11-24': { id: '2023-11-24', status: 'done', title: 'Peito & Tríceps' },
  '2023-11-25': { id: '2023-11-25', status: 'missed', title: 'Cardio' },
  '2023-11-26': { id: '2023-11-26', status: 'today', title: 'Dorsal & Bíceps' },
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function HistoryCalendarModal({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDateInfo, setSelectedDateInfo] = useState<any>(null);

  const renderCalendarDays = () => {
    const days = [];
    const startOffset = 3; 
    const totalDays = 30;

    for (let i = 0; i < startOffset; i++) {
      days.push({ id: `empty-${i}`, type: 'empty' });
    }
    for (let i = 1; i <= totalDays; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const fullDate = `2023-11-${dayStr}`;
      const historyItem = FULL_HISTORY[fullDate];
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
            <Text style={styles.calendarMonthTitle}>Novembro 2025</Text>
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
                    <Text style={styles.selectedDayTitle}>Dia {selectedDateInfo.day} de Novembro</Text>
                    <View style={styles.selectedDayRow}>
                        <View style={[styles.statusDot, { backgroundColor: selectedDateInfo.status === 'done' ? '#008E00' : selectedDateInfo.status === 'missed' ? '#EF4444' : '#9CA3AF' }]} />
                        <Text style={styles.selectedDayWorkout}>{selectedDateInfo.title || "Sem registro"}</Text>
                    </View>
                    {selectedDateInfo.status === 'done' && (
                      <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => { 
                        onClose(); 
                        router.push({ pathname: '/workout/details', params: { id: selectedDateInfo.id, date: `Dia ${selectedDateInfo.day} de Novembro` } }); 
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