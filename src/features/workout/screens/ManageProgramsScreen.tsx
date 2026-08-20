import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WorkoutService } from '../services/WorkoutService';

/**
 * @description Lista todas as fichas de treino do usuário (a ativa no topo, as passadas
 * abaixo) — ponto de entrada real para editar a ficha atual, reativar uma ficha antiga ou
 * criar uma nova, em vez do botão de lápis pular direto pra "criar nova" sem alternativa.
 */
export default function ManageProgramsScreen() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await WorkoutService.getAllPrograms();
      setPrograms(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleActivate = async (programId: string) => {
    try {
      await WorkoutService.activateProgram(programId);
      await load();
      Alert.alert('Ficha Ativada', 'Essa ficha voltou a ser a sua rotina atual. A fila de treinos foi reiniciada no Treino A.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível ativar essa ficha.');
      console.error(error);
    }
  };

  const handleDelete = (programId: string, title: string) => {
    Alert.alert('Excluir Ficha', `Tem certeza que deseja excluir "${title}"? Essa ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await WorkoutService.deleteProgram(programId);
            await load();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir essa ficha.');
            console.error(error);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/workout')} style={styles.backButton} accessibilityLabel="Voltar" accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#191511" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Fichas</Text>
        <TouchableOpacity
          // `workout/create` é uma Tabs.Screen oculta — o React Navigation mantém os params da
          // última vez que essa aba foi focada (aqui, um `programId` de uma edição anterior).
          // Passar `programId: ''` não limpa (uma string vazia some da querystring montada e o
          // navigator faz merge do objeto vazio resultante sobre o valor antigo, que persiste) —
          // por isso usa o sentinel não-vazio "new", tratado como "sem ficha" em CreateProgramScreen.
          onPress={() => router.replace({ pathname: '/(tabs)/workout/create', params: { programId: 'new' } })}
          style={styles.addButton}
          accessibilityLabel="Criar nova ficha"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF6E00" />
        </View>
      ) : programs.length === 0 ? (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons name="dumbbell" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Você ainda não criou nenhuma ficha.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {programs.map((program) => (
            <View key={program.id} style={[styles.card, program.is_active === 1 && styles.cardActive]}>
              <TouchableOpacity
                style={styles.cardBody}
                onPress={() => router.replace({ pathname: '/(tabs)/workout/create', params: { programId: program.id } })}
              >
                <View style={styles.cardTop}>
                  {program.is_active === 1 && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ATIVA</Text>
                    </View>
                  )}
                  <Text style={styles.cardTitle}>{program.title}</Text>
                </View>
                <Text style={styles.cardMeta}>
                  {program.goal || 'Sem objetivo definido'} · {program.sessionCount} {program.sessionCount === 1 ? 'treino' : 'treinos'} · {program.exerciseCount} {program.exerciseCount === 1 ? 'exercício' : 'exercícios'}
                </Text>
              </TouchableOpacity>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.replace({ pathname: '/(tabs)/workout/create', params: { programId: program.id } })}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#008E00" />
                  <Text style={styles.actionBtnText}>Editar</Text>
                </TouchableOpacity>

                {program.is_active !== 1 && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleActivate(program.id)}>
                    <MaterialCommunityIcons name="refresh" size={16} color="#008E00" />
                    <Text style={styles.actionBtnText}>Ativar</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(program.id, program.title)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, marginBottom: 8, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#008E00', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 12, textAlign: 'center' },
  list: { padding: 20, paddingTop: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  cardActive: { borderColor: '#008E00' },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  activeBadge: { backgroundColor: '#008E00', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  activeBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#191511', flexShrink: 1 },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#008E00', marginLeft: 6 },
});
