import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// IMPORT DO COMPONENTE NOVO
import HistoryCalendarModal from '../../../components/HistoryCalendarModal';

const { width } = Dimensions.get('window');

const MINI_TIMELINE = [
  { id: '1', day: 'SEG', date: '24', status: 'completed', title: 'Peito & Tríceps' },
  { id: '2', day: 'TER', date: '25', status: 'skipped', title: 'Cardio (Pulou)' },
  { id: '3', day: 'HOJE', date: '26', status: 'pending', title: 'Dorsal & Bíceps' },
  { id: '4', day: 'QUI', date: '27', status: 'future', title: 'Pernas' },
  { id: '5', day: 'SEX', date: '28', status: 'future', title: 'Ombros' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const startWorkout = () => { router.push('/workout/active'); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={[styles.header, { paddingTop: 20 }]}>
        <View>
          <Text style={styles.greeting}>Bom dia, Claus! 🔥</Text>
          <Text style={styles.date}>QUARTA, 26 NOV</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Visão Geral</Text>
            <View style={styles.streakBadge}><MaterialCommunityIcons name="fire" size={20} color="#F59E0B" /><Text style={styles.streakText}>12</Text></View>
          </View>
          <View style={styles.macroContainer}>
            <View style={styles.calorieCircle}><Text style={styles.calNumber}>1.250</Text><Text style={styles.calLabel}>restantes</Text></View>
            <View style={styles.macroBars}>
              <MacroBar label="Proteína" current={90} total={180} color="#008E00" />
              <MacroBar label="Carbo" current={150} total={300} color="#3B82F6" />
              <MacroBar label="Gordura" current={40} total={80} color="#F59E0B" />
            </View>
          </View>
        </View>

        {/* GRID DE AÇÃO */}
        <View style={styles.gridContainer}>
          <ActionButton icon="barcode-scan" color="#008E00" bg="#E3F9E5" label="Refeição" onPress={() => router.push('/(tabs)/diet')} />
          <ActionButton icon="dumbbell" color="#191511" bg="#F3F4F6" label="Treino" onPress={startWorkout} /> 
          <ActionButton icon="water-plus" color="#0EA5E9" bg="#E0F2FE" label="Água" onPress={() => {}} />
          <ActionButton icon="cart-outline" color="#D97706" bg="#FEF3C7" label="Mercado" onPress={() => {}} />
        </View>

        {/* SEÇÃO JORNADA */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Sua Jornada</Text>
          <TouchableOpacity onPress={() => setIsHistoryModalOpen(true)}>
            <Text style={styles.seeAllText}>Ver Tudo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timelineWidget}>
          <View style={styles.timelineLine} />
          {MINI_TIMELINE.map((item, index) => {
            const isLast = index === MINI_TIMELINE.length - 1;
            let dotColor = '#E5E7EB'; let dotBorder = '#E5E7EB'; let icon = null; let titleColor = '#9CA3AF';
            if (item.status === 'completed') { dotColor = '#008E00'; dotBorder = '#008E00'; icon = 'check'; titleColor = '#1F2937'; } 
            else if (item.status === 'skipped') { dotColor = '#EF4444'; dotBorder = '#EF4444'; icon = 'close'; titleColor = '#1F2937'; } 
            else if (item.status === 'pending') { dotColor = '#FFFFFF'; dotBorder = '#008E00'; titleColor = '#191511'; }
            return (
              <View key={item.id} style={[styles.timelineRow, isLast && { marginBottom: 0 }]}>
                <View style={styles.dateCol}><Text style={[styles.dayText, item.status === 'pending' && styles.todayText]}>{item.day}</Text></View>
                <View style={styles.nodeCol}><View style={[styles.node, { backgroundColor: dotColor, borderColor: dotBorder }, item.status === 'pending' && styles.nodePulse]}>{icon && <MaterialCommunityIcons name={icon as any} size={12} color="#FFF" />}</View></View>
                <View style={styles.infoCol}><Text style={[styles.workoutTitle, { color: titleColor }]}>{item.title}</Text>{item.status === 'pending' && (<Text style={styles.nowLabel}>Próximo Treino</Text>)}</View>
                {item.status === 'pending' && (<TouchableOpacity style={styles.playButton} onPress={startWorkout}><MaterialCommunityIcons name="play" size={16} color="#008E00" /></TouchableOpacity>)}
              </View>
            );
          })}
        </View>

        <View style={styles.bentoContainer}>
          <TouchableOpacity style={styles.wideWidget}>
            <View><Text style={styles.widgetLabel}>Peso Atual</Text><Text style={styles.widgetValue}>82.5 <Text style={styles.unit}>kg</Text></Text></View>
            <MaterialCommunityIcons name="chart-line" size={32} color="#008E00" opacity={0.2} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL REUTILIZÁVEL */}
      <HistoryCalendarModal 
        visible={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />
    </View>
  );
}

const ActionButton = ({ icon, color, bg, label, onPress }: any) => ( <TouchableOpacity style={styles.actionCard} onPress={onPress}><View style={[styles.iconBg, { backgroundColor: bg }]}><MaterialCommunityIcons name={icon} size={22} color={color} /></View><Text style={styles.actionText}>{label}</Text></TouchableOpacity> );
const MacroBar = ({ label, current, total, color }: any) => { const percentage = (current / total) * 100; return ( <View style={{ marginBottom: 12 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>{label}</Text><Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>{current}/{total}g</Text></View><View style={{ height: 6, backgroundColor: '#374151', borderRadius: 3 }}><View style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} /></View></View> ); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA'},
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FAFAFA', zIndex: 10 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#191511', marginBottom: 2, letterSpacing: -0.5 },
  date: { fontSize: 13, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 0 },
  heroCard: { backgroundColor: '#191511', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  streakText: { color: '#F59E0B', fontSize: 14, fontWeight: '800' },
  macroContainer: { flexDirection: 'row', alignItems: 'center' },
  calorieCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, borderColor: '#008E00', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  calNumber: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  calLabel: { color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase' },
  macroBars: { flex: 1 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  actionCard: { width: (width - 40 - 12) / 2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  iconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2937' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
  seeAllText: { fontSize: 14, fontWeight: '700', color: '#008E00' },
  timelineWidget: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F3F4F6', position: 'relative' },
  timelineLine: { position: 'absolute', left: 74, top: 30, bottom: 30, width: 2, backgroundColor: '#F3F4F6', zIndex: 0 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, zIndex: 1 },
  dateCol: { width: 45, alignItems: 'flex-end', marginRight: 12 },
  dayText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  todayText: { color: '#008E00', fontWeight: '800' },
  nodeCol: { width: 20, alignItems: 'center', marginRight: 12 },
  node: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  nodePulse: { width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
  infoCol: { flex: 1 },
  workoutTitle: { fontSize: 15, fontWeight: '600' },
  nowLabel: { fontSize: 11, color: '#008E00', fontWeight: '700', marginTop: 2 },
  playButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  bentoContainer: { gap: 12, marginTop: 0 },
  wideWidget: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  widgetLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4, fontWeight: '600' },
  widgetValue: { fontSize: 24, fontWeight: '800', color: '#191511' },
  unit: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
});