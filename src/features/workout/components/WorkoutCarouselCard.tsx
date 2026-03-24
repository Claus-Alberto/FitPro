import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const SPACING = 16;

interface Props {
  item: any;
  onPress: () => void;
}

export function WorkoutCarouselCard({ item, onPress }: Props) {
  const isToday = item.status === 'today';
  const isRest = item.status === 'rest';
  const workout = item.workout;

  // Renderiza Card Vazio (Sem treino marcado e não é descanso oficial)
  if (!workout && !isRest) {
    return (
      <View style={[styles.carouselCard, { width: CARD_WIDTH, marginRight: SPACING, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderStyle: 'dashed', borderWidth: 2 }]}>
        <MaterialCommunityIcons name="calendar-blank" size={40} color="#D1D5DB" />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#9CA3AF', marginTop: 12 }}>Dia Livre</Text>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>Você não tem nenhum treino agendado para este dia.</Text>
      </View>
    );
  }

  // Renderiza Card de Descanso EXPLÍCITO
  if (isRest) {
    return (
      <View style={[styles.carouselCard, styles.restCard, { width: CARD_WIDTH, marginRight: SPACING }]}>
        <View style={styles.restContent}>
          <MaterialCommunityIcons name="coffee" size={40} color="#3B82F6" />
          <Text style={styles.restTitle}>Dia de Descanso</Text>
          <Text style={styles.restDesc}>Recuperação ativa. Beba água e durma bem.</Text>
        </View>
      </View>
    );
  }

  // Renderiza Card de Treino
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.carouselCard,
        isToday && styles.cardActive, 
        item.status === 'completed' && styles.cardCompleted, 
        item.status === 'skipped' && styles.cardSkipped,
        { width: CARD_WIDTH, marginRight: SPACING }
      ]}
      onPress={onPress}
    >
      {/* Header do Card */}
      <View style={styles.cardHeader}>
        <View style={styles.badgeContainer}>
          <View style={[
            styles.letterBadge, 
            isToday ? { backgroundColor: '#008E00' } : 
            item.status === 'completed' ? { backgroundColor: '#E3F9E5' } : 
            item.status === 'skipped' ? { backgroundColor: '#FEE2E2' } : {}
          ]}>
            <Text style={[
              styles.letterText, 
              isToday ? { color: '#FFF' } : 
              item.status === 'completed' ? { color: '#008E00' } : 
              item.status === 'skipped' ? { color: '#EF4444' } : {}
            ]}>{workout.id}</Text>
          </View>
          <View>
            <Text style={styles.cardType}>{workout.type}</Text>
            <Text style={styles.cardTitle}>{workout.title}</Text>
          </View>
        </View>
        
        {item.status === 'completed' && (<MaterialCommunityIcons name="check-circle" size={24} color="#008E00" />)}
        {item.status === 'skipped' && (<MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />)}
      </View>

      {/* Informações (Tempo/Kcal) */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="clock-outline" size={18} color="#6B7280" />
          <Text style={styles.infoText}>{workout.duration}</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="fire" size={18} color="#6B7280" />
          <Text style={styles.infoText}>{workout.kcal || '~400'} kcal</Text>
        </View>
      </View>

      {/* Botão de Ação (Rodapé do Card) */}
      {isToday ? (
        <TouchableOpacity style={styles.startButton} onPress={onPress}>
          <Text style={styles.startButtonText}>INICIAR TREINO</Text>
          <MaterialCommunityIcons name="play" size={20} color="#FFF" />
        </TouchableOpacity>
      ) : item.status === 'completed' ? (
        <View style={styles.completedTag}>
           <Text style={styles.completedText}>Ver Detalhes</Text>
           <MaterialCommunityIcons name="chevron-right" size={16} color="#008E00" />
        </View>
      ) : item.status === 'skipped' ? (
        <View style={styles.skippedTag}>
           <Text style={styles.skippedText}>Toque para Resolver</Text>
           <MaterialCommunityIcons name="restore" size={16} color="#EF4444" />
        </View>
      ) : (
        <View style={styles.inactiveState}>
           <Text style={styles.inactiveText}>Ver Planejamento</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  carouselCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardActive: { borderColor: '#008E00', borderWidth: 2, transform: [{ scale: 1 }] },
  cardCompleted: { backgroundColor: '#F9FAFB' },
  cardSkipped: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  restCard: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', justifyContent: 'center', alignItems: 'center' },
  restContent: { alignItems: 'center', gap: 12 },
  restTitle: { fontSize: 20, fontWeight: '800', color: '#0EA5E9' },
  restDesc: { fontSize: 14, color: '#0284C7', textAlign: 'center', paddingHorizontal: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  badgeContainer: { flexDirection: 'row', gap: 12 },
  letterBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  letterText: { fontSize: 18, fontWeight: '800', color: '#6B7280' },
  cardType: { fontSize: 12, color: '#008E00', fontWeight: '700', marginBottom: 2 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#191511', maxWidth: 200 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  infoText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  startButton: { backgroundColor: '#191511', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  startButtonText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  inactiveState: { paddingVertical: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  inactiveText: { color: '#6B7280', fontWeight: '600' },
  completedTag: { backgroundColor: '#E3F9E5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  completedText: { color: '#008E00', fontWeight: '700', fontSize: 14 },
  skippedTag: { backgroundColor: '#FEF2F2', paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  skippedText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});