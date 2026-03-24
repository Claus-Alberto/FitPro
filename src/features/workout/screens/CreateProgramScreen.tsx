import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { WorkoutService } from '../services/WorkoutService';

/**
 * @description Tela para criar um novo Template de Ficha de Treino (Program)
 * Mantém foco em redução de atrito e gatilhos de transformação.
 */
export default function CreateProgramScreen() {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<'Hipertrofia' | 'Secar'>('Hipertrofia');
  const [sessions, setSessions] = useState([
    { letter: 'A', title: 'Peito, Ombro e Tríceps', duration_estimate: 45 },
    { letter: 'B', title: 'Costas e Bíceps', duration_estimate: 45 }
  ]);

  const handleAddSession = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLetter = letters[sessions.length] || 'X';
    setSessions([...sessions, { letter: nextLetter, title: `Treino ${nextLetter}`, duration_estimate: 45 }]);
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

  const handleSave = async () => {
    if (!name.trim()) {
      return Alert.alert('Ops!', 'Dê um nome inspirador para a sua nova ficha de treino.');
    }

    try {
      await WorkoutService.saveNewProgram(name, goal, sessions);
      Alert.alert('Ficha Forjada!', 'Sua nova rotina de treino está pronta para o combate.', [
        { text: 'Bora Treinar', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um problema ao salvar no banco de dados local.');
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#191511" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forjar Nova Ficha</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>Monte o plano perfeito para conquistar o físico que você deseja.</Text>

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
          <Text style={styles.submitText}>CRIAR MÁQUINA DE RESULTADOS</Text>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  addSessionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#008E00', borderRadius: 12 },
  addSessionText: { fontSize: 14, fontWeight: '700', color: '#008E00' },
  footer: { backgroundColor: '#FFF', padding: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  submitButton: { backgroundColor: '#FF6E00', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, shadowColor: '#FF6E00', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  submitText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
});
