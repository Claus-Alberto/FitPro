import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- DADOS MOCKADOS DE UM TREINO PASSADO ---
// Na vida real, você buscaria isso do seu banco usando o ID da data
const HISTORY_DETAIL = {
  date: '26 Nov, 2025',
  weekday: 'Quarta-feira',
  title: 'Costas & Bíceps (Hypertrophy)',
  duration: '1h 15m',
  totalLoad: '4.2 Ton',
  mood: 'fire', // fire, tired, strong
  
  // As fotos que ele tirou no "Pump Check"
  photos: [
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&w=800&q=80", // Costas
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&w=800&q=80", // Bíceps
  ],

  exercises: [
    {
      name: "Puxada Alta (Polia)",
      sets: [
        { weight: 45, reps: 12, completed: true },
        { weight: 50, reps: 10, completed: true },
        { weight: 55, reps: 8, completed: true }, // PR
      ]
    },
    {
      name: "Remada Curvada",
      sets: [
        { weight: 60, reps: 10, completed: true },
        { weight: 60, reps: 10, completed: true },
        { weight: 65, reps: 8, completed: true },
      ]
    },
    {
      name: "Rosca Direta",
      sets: [
        { weight: 12, reps: 15, completed: true },
        { weight: 14, reps: 12, completed: true },
        { weight: 16, reps: 10, completed: false }, // Falhou
      ]
    }
  ]
};

export default function HistoryDetailScreen() {
  const { date } = useLocalSearchParams(); // Pega a data da URL
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#191511" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Detalhes do Treino</Text>
          <Text style={styles.headerDate}>{date}</Text>
        </View>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* GALERIA DE FOTOS (THE VAULT) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContainer}>
          {HISTORY_DETAIL.photos.map((photo, index) => (
            <View key={index} style={styles.photoCard}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <View style={styles.photoBadge}>
                <MaterialCommunityIcons name="camera" size={12} color="#FFF" />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* STATUS GERAL */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#6B7280" />
              <Text style={styles.statValue}>{HISTORY_DETAIL.duration}</Text>
              <Text style={styles.statLabel}>Duração</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="weight-lifter" size={20} color="#6B7280" />
              <Text style={styles.statValue}>{HISTORY_DETAIL.totalLoad}</Text>
              <Text style={styles.statLabel}>Volume</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="emoticon-cool-outline" size={20} color="#6B7280" />
              <Text style={styles.statValue}>Ótimo</Text>
              <Text style={styles.statLabel}>Feeling</Text>
            </View>
          </View>
        </View>

        {/* TÍTULO DO TREINO */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={styles.workoutTitle}>{HISTORY_DETAIL.title}</Text>
          <View style={styles.tagsRow}>
            <View style={styles.tag}><Text style={styles.tagText}>Musculação</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>3 Exercícios</Text></View>
          </View>
        </View>

        {/* LISTA DE EXERCÍCIOS (LOG) */}
        <View style={styles.logContainer}>
          {HISTORY_DETAIL.exercises.map((ex, i) => (
            <View key={i} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <MaterialCommunityIcons name="check-circle" size={18} color="#008E00" />
              </View>

              <View style={styles.setsContainer}>
                <View style={styles.setHeader}>
                  <Text style={styles.colLabel}>SET</Text>
                  <Text style={styles.colLabel}>KG</Text>
                  <Text style={styles.colLabel}>REPS</Text>
                </View>
                {ex.sets.map((set, k) => (
                  <View key={k} style={[styles.setRow, !set.completed && { opacity: 0.5 }]}>
                    <View style={styles.setBadge}>
                      <Text style={styles.setText}>{k + 1}</Text>
                    </View>
                    <Text style={styles.valText}>{set.weight}</Text>
                    <Text style={styles.valText}>{set.reps}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#191511' },
  headerDate: { fontSize: 12, color: '#6B7280' },

  galleryContainer: { paddingHorizontal: 20, paddingVertical: 20, gap: 12 },
  photoCard: { width: 140, height: 180, borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#E5E7EB', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 12 },

  statsCard: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#191511', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' },
  divider: { width: 1, height: 30, backgroundColor: '#F3F4F6' },

  workoutTitle: { fontSize: 24, fontWeight: '800', color: '#191511', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#F3F4F6', borderRadius: 8 },
  tagText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

  logContainer: { paddingHorizontal: 20, gap: 16 },
  exerciseCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#191511' },
  
  setsContainer: { gap: 8 },
  setHeader: { flexDirection: 'row', paddingLeft: 40, paddingRight: 20, justifyContent: 'space-between', marginBottom: 4 },
  colLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', width: 40, textAlign: 'center' },
  
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 },
  setBadge: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  setText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  valText: { fontSize: 14, fontWeight: '600', color: '#191511', width: 40, textAlign: 'center' },
});