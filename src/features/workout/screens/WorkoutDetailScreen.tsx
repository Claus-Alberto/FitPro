import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { WorkoutService } from '../services/WorkoutService';

const { width, height } = Dimensions.get('window');

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

/**
 * @description Converte o WorkoutLog real (SQLite, via WorkoutService.getWorkoutLogByDate/ById)
 * para o formato que esta tela renderiza. Substitui o antigo WORKOUT_DATABASE fixo.
 * `rpe`, `rest` e `exercise_kcal` não são coletados hoje no treino ativo, então ficam com
 * valores neutros até existir uma fonte real para eles.
 */
const adaptLogToViewModel = (log: any) => ({
  title: log.title,
  date: log.date,
  duration: log.duration,
  total_volume: log.total_volume,
  calories: '—',
  mood: 'strong',
  hero_image: DEFAULT_HERO_IMAGE,
  user_photos: log.photos || [],
  exercises: log.exercises.map((ex: any, i: number) => ({
    id: i + 1,
    name: ex.name,
    muscle: '',
    exercise_kcal: null,
    history: ex.sets.map((s: any, si: number) => ({ date: `Série ${si + 1}`, weight: s.weight || 0 })),
    sets: ex.sets.map((s: any) => ({ id: s.id, weight: `${s.weight}kg`, reps: s.reps, rest: '—' })),
  })),
});

// COMPONENTE DE GRÁFICO (Mantido igual)
const ProgressChart = ({ data }: { data: { date: string, weight: number }[] }) => {
    const chartHeight = 150;
    const chartWidth = width - 80; 
    const padding = 20;

    const weights = data.map(d => d.weight);
    const maxWeight = Math.max(...weights) + 5;
    const minWeight = Math.min(...weights) - 5;
    
    const getY = (weight: number) => chartHeight - ((weight - minWeight) / (maxWeight - minWeight)) * (chartHeight - padding * 2) - padding;
    const getX = (index: number) => (index / (data.length - 1)) * (chartWidth - padding) + padding / 2;
    const points = data.map((d, i) => `${getX(i)},${getY(d.weight)}`).join(' ');

    return (
        <View style={styles.chartContainer}>
            <Svg width={chartWidth} height={chartHeight}>
                <Line x1="0" y1={getY(maxWeight)} x2={chartWidth} y2={getY(maxWeight)} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                <Line x1="0" y1={getY(minWeight)} x2={chartWidth} y2={getY(minWeight)} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                <Polyline points={points} fill="none" stroke="#008E00" strokeWidth="3" />
                {data.map((d, i) => (
                    <React.Fragment key={i}>
                        <Circle cx={getX(i)} cy={getY(d.weight)} r="5" fill="#191511" stroke="#008E00" strokeWidth="2" />
                        <SvgText x={getX(i)} y={getY(d.weight) - 10} fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle">{d.weight}kg</SvgText>
                        <SvgText x={getX(i)} y={chartHeight - 5} fill="#6B7280" fontSize="10" textAnchor="middle">{d.date}</SvgText>
                    </React.Fragment>
                ))}
            </Svg>
        </View>
    );
};

export default function WorkoutDetailScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams<{ date?: string }>();

    const [currentWorkout, setCurrentWorkout] = useState<any | null>(null);
    const [isLoadingLog, setIsLoadingLog] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoadingLog(true);
            const date = Array.isArray(params.date) ? params.date[0] : params.date;
            const log = date ? await WorkoutService.getWorkoutLogByDate(date) : null;
            if (!cancelled) {
                setCurrentWorkout(log ? adaptLogToViewModel(log) : null);
                setIsLoadingLog(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [params.date]);

    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedExercise, setSelectedExercise] = useState<any>(null);
    const [isChartVisible, setIsChartVisible] = useState(false);

    const openExerciseDetails = (exercise: any) => {
        setSelectedExercise(exercise);
        setIsChartVisible(false);
    };

    // TRUQUE DO CARROSSEL INFINITO (Adaptado para usar dados dinâmicos)
    const infinitePhotos = useMemo(() => {
        if (!currentWorkout?.user_photos || currentWorkout.user_photos.length === 0) return [];
        const LOOP_COUNT = 100;
        return Array(LOOP_COUNT).fill(currentWorkout.user_photos).flat();
    }, [currentWorkout]);

    const initialScrollIndex = useMemo(() => {
        if (!currentWorkout?.user_photos || currentWorkout.user_photos.length === 0) return 0;
        return (currentWorkout.user_photos.length * 100) / 2;
    }, [currentWorkout]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0 && currentWorkout?.user_photos?.length > 0) {
            const realIndex = viewableItems[0].index % currentWorkout.user_photos.length;
            setCurrentImageIndex(realIndex);
        }
    }).current;

    const renderPhotoItem = ({ item }: { item: string }) => (
        <View style={styles.modalPhotoContainer}>
            <Image source={{ uri: item }} style={styles.modalPhoto} />
        </View>
    );

    if (isLoadingLog || !currentWorkout) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen options={{ headerShown: false }} />
                {isLoadingLog ? (
                    <ActivityIndicator size="large" color="#008E00" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="calendar-remove" size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
                        <Text style={{ color: '#6B7280', fontWeight: '600', marginBottom: 20 }}>Nenhum treino registrado nessa data.</Text>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#191511" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <StatusBar 
                barStyle="light-content" 
                hidden={isGalleryOpen || !!selectedExercise} 
                backgroundColor={isGalleryOpen || !!selectedExercise ? "#000" : "transparent"} 
                translucent 
            />
            
            {/* 1. HEADER HERO */}
            <View style={styles.headerImageContainer}>
                <Image source={{ uri: currentWorkout.hero_image }} style={styles.headerImage} />
                <View style={styles.headerOverlay} />
                <TouchableOpacity style={[styles.backButton, { top: insets.top + 10 }]} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.moodBadge}>
                        <MaterialCommunityIcons name="lightning-bolt" size={16} color="#000" />
                        <Text style={styles.moodText}>
                            {currentWorkout.mood === 'fire' ? 'Treino Intenso' : currentWorkout.mood === 'tired' ? 'Treino Cansativo' : 'Treino Padrão'}
                        </Text>
                    </View>
                    <Text style={styles.workoutTitle}>{currentWorkout.title}</Text>
                    <Text style={styles.workoutDate}>{currentWorkout.date}</Text>
                </View>
            </View>

            {/* 2. SCROLL CONTENT */}
            <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                
                {/* STATS */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <MaterialCommunityIcons name="clock-time-four-outline" size={24} color="#008E00" />
                        <Text style={styles.statValue}>{currentWorkout.duration}</Text>
                        <Text style={styles.statLabel}>Duração</Text>
                    </View>
                    <View style={[styles.statBox, styles.statBorder]}>
                        <MaterialCommunityIcons name="weight-lifter" size={24} color="#3B82F6" />
                        <Text style={styles.statValue}>{currentWorkout.total_volume}</Text>
                        <Text style={styles.statLabel}>Volume</Text>
                    </View>
                    <View style={styles.statBox}>
                        <MaterialCommunityIcons name="fire" size={24} color="#F59E0B" />
                        <Text style={styles.statValue}>{currentWorkout.calories}</Text>
                        <Text style={styles.statLabel}>Gasto Total</Text>
                    </View>
                </View>
                
                {/* LISTA DE EXERCÍCIOS */}
                <Text style={styles.sectionTitle}>Resumo dos Exercícios</Text>
                <View style={styles.exerciseList}>
                    {currentWorkout.exercises.map((exercise: any, index: number) => (
                        <TouchableOpacity 
                            key={exercise.id} 
                            activeOpacity={0.9}
                            onPress={() => openExerciseDetails(exercise)}
                            style={styles.exerciseCard}
                        >
                            <View style={styles.exerciseHeader}>
                                <View style={styles.exerciseIcon}>
                                    <Text style={styles.exerciseIndex}>{index + 1}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                    <Text style={styles.muscleTag}>{exercise.muscle}</Text>
                                </View>
                                <View style={styles.kcalBadge}>
                                    <MaterialCommunityIcons name="fire" size={12} color="#F59E0B" />
                                    <Text style={styles.kcalText}>~{exercise.exercise_kcal}</Text>
                                </View>
                            </View>

                            <View style={styles.setsTable}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.colHeader, { width: 30 }]}>#</Text>
                                    <Text style={[styles.colHeader, { flex: 1 }]}>CARGA</Text>
                                    <Text style={[styles.colHeader, { flex: 1 }]}>REPS</Text>
                                    <Text style={[styles.colHeader, { width: 60 }]}>PAUSA</Text>
                                </View>
                                {exercise.sets.map((set: any) => (
                                    <View key={set.id} style={styles.setRow}>
                                        <Text style={[styles.setCell, { width: 30, color: '#9CA3AF' }]}>{set.id}</Text>
                                        <View style={[styles.setCell, { flex: 1 }]}>
                                            <Text style={styles.weightText}>{set.weight}</Text>
                                            {set.pr && <View style={styles.prBadge}><Text style={styles.prText}>PR 🏆</Text></View>}
                                        </View>
                                        <Text style={[styles.setCell, { flex: 1, fontWeight: '700' }]}>{set.reps}</Text>
                                        <View style={[styles.setCell, { width: 60, flexDirection: 'row', gap: 4 }]}>
                                            <MaterialCommunityIcons name="timer-outline" size={14} color="#9CA3AF" />
                                            <Text style={styles.restText}>{set.rest}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.cardFooterText}>Ver progresso e histórico</Text>
                                <MaterialCommunityIcons name="chart-line" size={16} color="#008E00" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* FAB GALERIA (SÓ SE TIVER FOTOS) */}
            {currentWorkout.user_photos && currentWorkout.user_photos.length > 0 && (
                <TouchableOpacity style={styles.galleryFab} activeOpacity={0.9} onPress={() => setIsGalleryOpen(true)}>
                    <Image source={{ uri: currentWorkout.user_photos[0] }} style={styles.fabThumbnail} />
                    <View style={styles.fabBadge}>
                        <MaterialCommunityIcons name="camera" size={10} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.fabBadgeText}>{currentWorkout.user_photos.length}</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* --- MODAL DA GALERIA --- */}
            <Modal visible={isGalleryOpen} transparent={true} animationType="fade" statusBarTranslucent={true} onRequestClose={() => setIsGalleryOpen(false)}>
                <View style={styles.modalBackground}>
                    <TouchableOpacity style={[styles.modalCloseBtn, { top: insets.top + 20 }]} onPress={() => setIsGalleryOpen(false)}>
                        <MaterialCommunityIcons name="close" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                    <FlatList
                        data={infinitePhotos}
                        renderItem={renderPhotoItem}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
                        initialScrollIndex={initialScrollIndex}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    />
                    <View style={[styles.indicatorsContainer, { bottom: insets.bottom + 40 }]}>
                        {currentWorkout.user_photos.map((_: any, index: number) => {
                            const isActive = index === currentImageIndex;
                            return (
                                <View key={index} style={[styles.indicatorBar, isActive ? styles.indicatorActive : styles.indicatorInactive]} />
                            );
                        })}
                    </View>
                </View>
            </Modal>

            {/* --- MODAL DE DETALHES DO EXERCÍCIO --- */}
            <Modal visible={!!selectedExercise} transparent={true} animationType="slide" statusBarTranslucent={true} onRequestClose={() => setSelectedExercise(null)}>
                <View style={styles.exModalBackdrop}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedExercise(null)} />
                    <View style={[styles.exModalContent, { paddingBottom: insets.bottom + 20 }]}>
                        {selectedExercise && (
                            <>
                                <View style={styles.exModalHeader}>
                                    <View>
                                        <Text style={styles.exModalTitle}>{selectedExercise.name}</Text>
                                        <Text style={styles.exModalSubtitle}>{selectedExercise.muscle} • Histórico</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedExercise(null)} style={styles.closeIconBg}>
                                        <MaterialCommunityIcons name="close" size={24} color="#191511" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {/* Tabela dentro do Modal */}
                                    <View style={styles.setsTable}>
                                        {/* (Reutilizando estilo da tabela) */}
                                        {selectedExercise.sets.map((set: any) => (
                                            <View key={set.id} style={styles.setRow}>
                                                <Text style={[styles.setCell, { width: 30, color: '#9CA3AF' }]}>{set.id}</Text>
                                                <View style={[styles.setCell, { flex: 1 }]}>
                                                    <Text style={styles.weightText}>{set.weight}</Text>
                                                </View>
                                                <Text style={[styles.setCell, { flex: 1, fontWeight: '700' }]}>{set.reps}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity style={[styles.chartToggleBtn, isChartVisible && styles.chartToggleBtnActive]} onPress={() => setIsChartVisible(!isChartVisible)}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={20} color={isChartVisible ? "#FFF" : "#191511"} />
                                            <Text style={[styles.chartToggleText, isChartVisible && { color: '#FFF' }]}>{isChartVisible ? 'Ocultar Gráfico' : 'Exibir Progresso de Carga'}</Text>
                                        </View>
                                        <MaterialCommunityIcons name={isChartVisible ? "chevron-up" : "chevron-down"} size={20} color={isChartVisible ? "#FFF" : "#191511"} />
                                    </TouchableOpacity>

                                    {isChartVisible && selectedExercise.history && (
                                        <View style={styles.chartWrapper}>
                                            <Text style={styles.chartTitle}>Evolução de Carga (kg)</Text>
                                            <ProgressChart data={selectedExercise.history} />
                                            <Text style={styles.chartSubtitle}>Você aumentou 12% a força este mês! 🔥</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    headerImageContainer: { height: 300, width: '100%', position: 'relative' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderBottomWidth: 100, borderBottomColor: 'transparent' },
    backButton: { position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    headerContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40 },
    moodBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4, marginBottom: 12 },
    moodText: { fontSize: 12, fontWeight: '800', color: '#000' },
    workoutTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    workoutDate: { fontSize: 14, color: '#E5E7EB', fontWeight: '600' },
    contentScroll: { flex: 1, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FAFAFA' },
    statsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 24, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, marginBottom: 32 },
    statBox: { flex: 1, alignItems: 'center', gap: 4 },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F3F4F6' },
    statValue: { fontSize: 18, fontWeight: '800', color: '#191511', marginTop: 4 },
    statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511', marginLeft: 24, marginBottom: 16 },
    exerciseList: { paddingHorizontal: 20, gap: 16 },
    exerciseCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 2 },
    exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    exerciseIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    exerciseIndex: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    exerciseName: { fontSize: 16, fontWeight: '700', color: '#191511' },
    muscleTag: { fontSize: 12, color: '#008E00', fontWeight: '600' },
    kcalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, gap: 2 },
    kcalText: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
    setsTable: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12 },
    tableHeader: { flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    colHeader: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },
    setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    setCell: { textAlign: 'center', fontSize: 14, color: '#1F2937' },
    weightText: { fontWeight: '700', color: '#191511' },
    restText: { fontSize: 12, color: '#6B7280' },
    prBadge: { position: 'absolute', right: -24, top: -8, backgroundColor: '#F59E0B', paddingHorizontal: 4, borderRadius: 4, transform: [{ scale: 0.7 }] },
    prText: { color: '#000', fontSize: 10, fontWeight: '800' },
    galleryFab: { position: 'absolute', bottom: 30, right: 24, width: 64, height: 64, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, transform: [{ rotate: '-3deg' }] },
    fabThumbnail: { width: '100%', height: '100%', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    fabBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#191511', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#FFFFFF' },
    fabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    cardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    cardFooterText: { fontSize: 12, color: '#008E00', fontWeight: '600' },
    modalBackground: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', width: width, height: height },
    modalCloseBtn: { position: 'absolute', right: 24, zIndex: 20, padding: 8 },
    modalPhotoContainer: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    modalPhoto: { width: width, height: '70%', resizeMode: 'contain' },
    indicatorsContainer: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    indicatorBar: { flex: 1, height: 3, borderRadius: 2 },
    indicatorActive: { backgroundColor: '#FFFFFF', shadowColor: "#FFF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
    indicatorInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },
    exModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', width: width, height: height },
    exModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '70%', shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
    exModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    exModalTitle: { fontSize: 22, fontWeight: '800', color: '#191511', width: width * 0.7 },
    exModalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    closeIconBg: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
    chartToggleBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, marginTop: 24 },
    chartToggleBtnActive: { backgroundColor: '#191511' },
    chartToggleText: { fontSize: 14, fontWeight: '700', color: '#191511' },
    chartWrapper: { marginTop: 20, backgroundColor: '#191511', borderRadius: 16, padding: 20, alignItems: 'center' },
    chartTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginBottom: 20, alignSelf: 'flex-start' },
    chartContainer: { alignItems: 'center', justifyContent: 'center' },
    chartSubtitle: { color: '#008E00', fontSize: 12, fontWeight: '700', marginTop: 16 },
});