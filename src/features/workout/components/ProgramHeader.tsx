import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  programName: string;
  week: number;
  totalWeeks: number;
  schedulingMode: 'calendar' | 'queue';
  onToggleMode: () => void;
  onEditPress: () => void;
}

export function ProgramHeader({ programName, week, totalWeeks, schedulingMode, onToggleMode, onEditPress }: Props) {
  // Calcula progresso (ex: 4/12)
  const progressWidth = `${(week / totalWeeks) * 100}%`;

  return (
    <View style={styles.programCard}>
      <View style={styles.programHeader}>
        <View>
          <Text style={styles.programLabel}>CICLO ATUAL</Text>
          <Text style={styles.programTitle}>{programName}</Text>
          <TouchableOpacity onPress={onToggleMode} style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
             <Text style={{ color: '#008E00', fontSize: 12, fontWeight: '700' }}>
               Modo: {schedulingMode === 'calendar' ? 'Calendário Fixo' : 'Fila Flexível (Queue)'}
             </Text>
             <MaterialCommunityIcons name="refresh" size={14} color="#008E00" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.weekBadge}>
            <Text style={styles.weekText}>Sem {week}/{totalWeeks}</Text>
          </View>
          <TouchableOpacity onPress={onEditPress} style={styles.editButton} accessibilityLabel="Gerenciar fichas de treino" accessibilityRole="button">
            <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: progressWidth as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  programCard: { backgroundColor: '#191511', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, marginBottom: 24 },
  programHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  programLabel: { color: '#008E00', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  programTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  editButton: { backgroundColor: 'rgba(255,255,255,0.1)', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  weekBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, height: 28, justifyContent: 'center' },
  weekText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  progressBarBg: { height: 4, backgroundColor: '#374151', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: '#008E00', borderRadius: 2 },
});