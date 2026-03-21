import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// IMPORT DO SVG PARA O GRÁFICO
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- DADOS MOCKADOS ---

const USER_STATS = {
  level: 12,
  title: "Titã em Ascensão",
  currentXp: 2400,
  nextLevelXp: 3000,
  totalBadges: 50,
  unlockedBadges: 15,
};

// Dados de Peso e Bioimpedância
const WEIGHT_HISTORY = [
  { date: '01 Set', weight: 85.0, bodyFat: 22.0, muscleMass: 38.0, boneMass: 3.2, water: 55 },
  { date: '15 Set', weight: 84.2, bodyFat: 21.5, muscleMass: 38.2, boneMass: 3.2, water: 55 },
  { date: '01 Out', weight: 83.5, bodyFat: 20.8, muscleMass: 38.5, boneMass: 3.2, water: 56 },
  { date: '15 Out', weight: 82.8, bodyFat: 20.0, muscleMass: 38.8, boneMass: 3.3, water: 56 },
  { date: '01 Nov', weight: 82.5, bodyFat: 19.5, muscleMass: 39.0, boneMass: 3.3, water: 57 }, // Atual
];

// Medalhas principais
const BADGES = [
  { id: '1', title: 'Primeiros Passos', desc: 'Complete seu primeiro treino.', icon: 'shoe-print', color: '#008E00', unlocked: true },
  { id: '2', title: 'Consistência', desc: 'Treine 7 dias seguidos.', icon: 'fire', color: '#F59E0B', unlocked: true },
  { id: '3', title: 'Madrugador', desc: 'Treine antes das 6h da manhã.', icon: 'weather-sunset-up', color: '#3B82F6', unlocked: true },
  { id: '4', title: 'Peso Pesado', desc: 'Levante um total de 10 toneladas.', icon: 'weight-lifter', color: '#8B5CF6', unlocked: true, progress: '100%' },
  { id: '5', title: 'Maratonista', desc: 'Corra 42km no total.', icon: 'run', color: '#EF4444', unlocked: false, progress: '65%' },
  { id: '6', title: 'Rei do Supino', desc: 'Supino com 1.5x seu peso corporal.', icon: 'arm-flex', color: '#F59E0B', unlocked: false, progress: '80%' },
  { id: '7', title: 'Monge', desc: 'Medite após 5 treinos.', icon: 'meditation', color: '#10B981', unlocked: false, progress: '20%' },
  { id: '8', title: 'Social', desc: 'Compartilhe 10 treinos.', icon: 'share-variant', color: '#3B82F6', unlocked: false, progress: '40%' },
  { id: '9', title: 'Lendário', desc: 'Alcance o nível 50.', icon: 'crown', color: '#F59E0B', unlocked: false, progress: '24%' },
];

const EVENT_BADGES = [
  { id: 'e1', title: 'Treino Natalino', desc: 'Complete um treino no dia 25 de Dezembro.', icon: 'pine-tree', color: '#EF4444', unlocked: false, isEvent: true },
  { id: 'e2', title: 'Ano Novo Vida Nova', desc: 'Mantenha uma streak de 7 dias na primeira semana de Janeiro.', icon: 'party-popper', color: '#F59E0B', unlocked: false, isEvent: true },
  { id: 'e3', title: 'Coelhinho Fitness', desc: 'Treine no domingo de Páscoa.', icon: 'rabbit', color: '#EC4899', unlocked: false, isEvent: true },
  { id: 'e4', title: 'Folia de Músculos', desc: 'Treine todos os dias do Carnaval.', icon: 'drama-masks', color: '#8B5CF6', unlocked: true, isEvent: true },
];

// Recordes Pessoais
const PERSONAL_RECORDS = [
  { 
    id: 'pr1', 
    exercise: 'Supino Reto', 
    weight: '100 kg', 
    date: '20 Nov 2025', 
    isNew: true,
    history: [
      { date: 'ago', value: 80 }, { date: 'set', value: 85 }, { date: 'out', value: 92 }, { date: 'nov', value: 100 }
    ]
  },
  { 
    id: 'pr2', 
    exercise: 'Agachamento', 
    weight: '140 kg', 
    date: '15 Out 2025', 
    isNew: false,
    history: [
      { date: 'jul', value: 100 }, { date: 'ago', value: 120 }, { date: 'set', value: 130 }, { date: 'out', value: 140 }
    ]
  },
  { 
    id: 'pr3', 
    exercise: 'Levantamento Terra', 
    weight: '180 kg', 
    date: '01 Nov 2025', 
    isNew: false,
    history: [
      { date: 'ago', value: 150 }, { date: 'set', value: 160 }, { date: 'out', value: 175 }, { date: 'nov', value: 180 }
    ]
  },
  { 
    id: 'pr4', 
    exercise: 'Leg Press 45', 
    weight: '320 kg', 
    date: '10 Nov 2025', 
    isNew: false,
    history: [
      { date: 'ago', value: 280 }, { date: 'set', value: 300 }, { date: 'out', value: 310 }, { date: 'nov', value: 320 }
    ]
  },
  { 
    id: 'pr5', 
    exercise: 'Desenvolvimento', 
    weight: '60 kg', 
    date: '12 Nov 2025', 
    isNew: false,
    history: [
      { date: 'ago', value: 40 }, { date: 'set', value: 50 }, { date: 'out', value: 55 }, { date: 'nov', value: 60 }
    ]
  },
];

// --- COMPONENTES AUXILIARES ---

// Gráfico Genérico
const LineChart = ({ data, color = "#008E00", unit = "kg" }: { data: { date: string, value: number }[], color?: string, unit?: string }) => {
  const chartHeight = 150;
  const chartWidth = width - 100;
  const padding = 20;

  if (!data || data.length === 0) return null;

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values) * 1.05; // 5% de margem
  const minValue = Math.min(...values) * 0.95;
  
  const getY = (val: number) => chartHeight - ((val - minValue) / (maxValue - minValue)) * (chartHeight - padding * 2) - padding;
  const getX = (index: number) => (index / (data.length - 1)) * (chartWidth - padding) + padding / 2;

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={chartWidth} height={chartHeight}>
        <Line x1="0" y1={getY(maxValue)} x2={chartWidth} y2={getY(maxValue)} stroke="#F3F4F6" strokeDasharray="4 4" strokeWidth="1" />
        <Line x1="0" y1={getY(minValue)} x2={chartWidth} y2={getY(minValue)} stroke="#F3F4F6" strokeDasharray="4 4" strokeWidth="1" />
        <Polyline points={points} fill="none" stroke={color} strokeWidth="3" />
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <Circle cx={getX(i)} cy={getY(d.value)} r="5" fill="#FFF" stroke={color} strokeWidth="2" />
            <SvgText x={getX(i)} y={getY(d.value) - 10} fill="#191511" fontSize="10" fontWeight="bold" textAnchor="middle">{d.value}{unit}</SvgText>
            <SvgText x={getX(i)} y={chartHeight} fill="#9CA3AF" fontSize="10" textAnchor="middle">{d.date}</SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

// Card de Bioimpedância
const BioCard = ({ title, value, unit, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.bioCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.bioIconBg, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.bioValue}>{value} <Text style={styles.bioUnit}>{unit}</Text></Text>
      <Text style={styles.bioTitle}>{title}</Text>
    </View>
    <View style={{position: 'absolute', top: 10, right: 10}}>
       <MaterialCommunityIcons name="chevron-right" size={16} color="#E5E7EB" />
    </View>
  </TouchableOpacity>
);

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Estados
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [isAllBadgesOpen, setIsAllBadgesOpen] = useState(false);
  const [isAllPRsOpen, setIsAllPRsOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [weightViewMode, setWeightViewMode] = useState<'simple' | 'advanced'>('simple');
  const [selectedBioMetric, setSelectedBioMetric] = useState<any>(null);
  
  const xpProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(xpProgress, {
      toValue: (USER_STATS.currentXp / USER_STATS.nextLevelXp) * 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const xpWidth = xpProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  const latestWeight = WEIGHT_HISTORY[WEIGHT_HISTORY.length - 1];

  const handleOpenBioMetric = (metricKey: string, title: string, unit: string, color: string) => {
    const historyData = WEIGHT_HISTORY.map(item => ({
      date: item.date,
      value: (item as any)[metricKey]
    }));
    setSelectedBioMetric({ title, unit, color, history: historyData });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#191511" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER DE NÍVEL */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conquistas</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelBadge}>
            <MaterialCommunityIcons name="shield-star" size={32} color="#F59E0B" />
            <View style={styles.levelPill}>
              <Text style={styles.levelNumber}>{USER_STATS.level}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.levelTitle}>{USER_STATS.title}</Text>
            <View style={styles.xpRow}>
              <View style={styles.xpTrack}>
                <Animated.View style={[styles.xpFill, { width: xpWidth }]} />
              </View>
              <Text style={styles.xpValues}>{USER_STATS.currentXp} / {USER_STATS.nextLevelXp} XP</Text>
            </View>
            <Text style={styles.badgeCountText}>
              <Text style={{ color: '#008E00', fontWeight: '800' }}>{USER_STATS.unlockedBadges}</Text>/{USER_STATS.totalBadges} Medalhas Desbloqueadas
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SEÇÃO 1: GALERIA DE BADGES */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="medal-outline" size={20} color="#191511" />
            <Text style={styles.sectionTitle}>Galeria de Medalhas</Text>
          </View>
          <TouchableOpacity onPress={() => setIsAllBadgesOpen(true)}>
             <Text style={styles.seeAllText}>Ver Mais</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgesGrid}>
          {BADGES.slice(0, 9).map((badge) => (
            <TouchableOpacity 
              key={badge.id} 
              style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]}
              onPress={() => setSelectedBadge(badge)}
              activeOpacity={0.8}
            >
              <View style={[styles.badgeIconCircle, badge.unlocked ? { backgroundColor: badge.color + '20' } : { backgroundColor: '#F3F4F6' }]}>
                <MaterialCommunityIcons 
                  name={badge.icon as any} 
                  size={28} 
                  color={badge.unlocked ? badge.color : '#9CA3AF'} 
                />
                {!badge.unlocked && (
                   <View style={styles.lockIcon}>
                     <MaterialCommunityIcons name="lock" size={10} color="#FFF" />
                   </View>
                )}
              </View>
              <Text style={[styles.badgeTitle, !badge.unlocked && { color: '#9CA3AF' }]} numberOfLines={1}>
                {badge.title}
              </Text>
              {!badge.unlocked && badge.progress && (<View style={styles.miniProgressTrack}><View style={[styles.miniProgressFill, { width: badge.progress as any }]} /></View>)}
            </TouchableOpacity>
          ))}
        </View>

        {/* --- SEÇÃO: EVOLUÇÃO CORPORAL --- */}
        <View style={[styles.sectionHeaderRow, { marginTop: 32 }]}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="human" size={20} color="#191511" />
            <Text style={styles.sectionTitle}>Evolução Corporal</Text>
          </View>
          
          <View style={styles.toggleContainer}>
             <TouchableOpacity style={[styles.toggleBtn, weightViewMode === 'simple' && styles.toggleBtnActive]} onPress={() => setWeightViewMode('simple')}>
                <Text style={[styles.toggleText, weightViewMode === 'simple' && styles.toggleTextActive]}>Simples</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.toggleBtn, weightViewMode === 'advanced' && styles.toggleBtnActive]} onPress={() => setWeightViewMode('advanced')}>
                <Text style={[styles.toggleText, weightViewMode === 'advanced' && styles.toggleTextActive]}>Avançado</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weightCard}>
           <View style={{paddingHorizontal: 16, paddingTop: 16}}>
             <Text style={styles.currentWeightTitle}>Peso Atual</Text>
             <Text style={styles.currentWeightValue}>{latestWeight.weight} <Text style={{fontSize: 16, color: '#6B7280'}}>kg</Text></Text>
           </View>
           <LineChart data={WEIGHT_HISTORY.map(h => ({ date: h.date, value: h.weight }))} color="#3B82F6" />
           {weightViewMode === 'advanced' && (
             <View style={styles.advancedStatsContainer}>
                <Text style={styles.advancedTitle}>Composição Corporal (Toque para ver histórico)</Text>
                <View style={styles.bioGrid}>
                   <BioCard title="Gordura" value={latestWeight.bodyFat} unit="%" icon="water-percent" color="#F59E0B" onPress={() => handleOpenBioMetric('bodyFat', 'Gordura Corporal', '%', '#F59E0B')} />
                   <BioCard title="Massa Magra" value={latestWeight.muscleMass} unit="kg" icon="arm-flex" color="#EF4444" onPress={() => handleOpenBioMetric('muscleMass', 'Massa Magra', 'kg', '#EF4444')} />
                   <BioCard title="Água" value={latestWeight.water} unit="%" icon="water" color="#3B82F6" onPress={() => handleOpenBioMetric('water', 'Água Corporal', '%', '#3B82F6')} />
                   <BioCard title="Massa Óssea" value={latestWeight.boneMass} unit="kg" icon="bone" color="#6B7280" onPress={() => handleOpenBioMetric('boneMass', 'Massa Óssea', 'kg', '#6B7280')} />
                </View>
             </View>
           )}
        </View>

        {/* SEÇÃO 2: RECORDES PESSOAIS (PRs) */}
        <View style={[styles.sectionHeaderRow, { marginTop: 32 }]}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="trophy-variant-outline" size={20} color="#191511" />
            <Text style={styles.sectionTitle}>Recordes Pessoais (PRs)</Text>
          </View>
          <TouchableOpacity onPress={() => setIsAllPRsOpen(true)}>
             <Text style={styles.seeAllText}>Ver Mais</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.prList}>
          {PERSONAL_RECORDS.slice(0, 4).map((pr, index) => (
            <TouchableOpacity key={index} style={styles.prCard} onPress={() => setSelectedPR(pr)} activeOpacity={0.8}>
              <View style={styles.prInfo}><Text style={styles.prExercise}>{pr.exercise}</Text><Text style={styles.prDate}>{pr.date}</Text></View>
              <View style={styles.prValueContainer}>
                <Text style={styles.prWeight}>{pr.weight}</Text>
                {pr.isNew && (<View style={styles.newPrBadge}><Text style={styles.newPrText}>NOVO</Text></View>)}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" style={{marginLeft: 8}} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- MODAIS DE DETALHES --- */}
      
      {/* Modal Medalha */}
      <Modal visible={!!selectedBadge} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedBadge(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedBadge(null)} />
          <View style={styles.modalContent}>
            <View style={[styles.modalIconCircle, { backgroundColor: selectedBadge?.unlocked ? selectedBadge?.color + '20' : '#F3F4F6' }]}>
              <MaterialCommunityIcons name={selectedBadge?.icon} size={48} color={selectedBadge?.unlocked ? selectedBadge?.color : '#9CA3AF'} />
            </View>
            {selectedBadge?.isEvent && (<View style={styles.eventBadgeTag}><Text style={styles.eventBadgeText}>EVENTO ESPECIAL</Text></View>)}
            <Text style={styles.modalTitle}>{selectedBadge?.title}</Text>
            <View style={[styles.modalStatusBadge, selectedBadge?.unlocked ? { backgroundColor: '#E3F9E5' } : { backgroundColor: '#F3F4F6' }]}>
               <Text style={[styles.modalStatusText, selectedBadge?.unlocked ? { color: '#008E00' } : { color: '#6B7280' }]}>{selectedBadge?.unlocked ? 'CONQUISTADA' : 'BLOQUEADA'}</Text>
            </View>
            <Text style={styles.modalDesc}>{selectedBadge?.desc}</Text>
            {!selectedBadge?.unlocked && selectedBadge?.progress && (
              <View style={{ width: '100%', marginTop: 16 }}>
                 <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, textAlign: 'center' }}>Progresso: {selectedBadge.progress}</Text>
                 <View style={styles.xpTrack}><View style={[styles.xpFill, { width: selectedBadge.progress, backgroundColor: '#6B7280' }]} /></View>
              </View>
            )}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedBadge(null)}><Text style={styles.modalCloseText}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ver Mais Medalhas */}
      <Modal visible={isAllBadgesOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsAllBadgesOpen(false)}>
        <View style={styles.fullScreenModal}>
          <View style={[styles.fullScreenHeader, { paddingTop: insets.top + 10 }]}>
             <Text style={styles.fullScreenTitle}>Todas as Conquistas</Text>
             <TouchableOpacity onPress={() => setIsAllBadgesOpen(false)} style={styles.closeRoundBtn}><MaterialCommunityIcons name="close" size={24} color="#191511" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.subHeaderList}>Medalhas de Progresso</Text>
            <View style={styles.badgesGrid}>
              {BADGES.map((badge) => (
                <TouchableOpacity key={badge.id} style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]} onPress={() => setSelectedBadge(badge)}>
                  <View style={[styles.badgeIconCircle, badge.unlocked ? { backgroundColor: badge.color + '20' } : { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name={badge.icon as any} size={28} color={badge.unlocked ? badge.color : '#9CA3AF'} />
                     {!badge.unlocked && <View style={styles.lockIcon}><MaterialCommunityIcons name="lock" size={10} color="#FFF" /></View>}
                  </View>
                  <Text style={[styles.badgeTitle, !badge.unlocked && { color: '#9CA3AF' }]} numberOfLines={1}>{badge.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.subHeaderList, { marginTop: 30 }]}>Eventos Especiais</Text>
            <View style={styles.badgesGrid}>
              {EVENT_BADGES.map((badge) => (
                <TouchableOpacity key={badge.id} style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]} onPress={() => setSelectedBadge(badge)}>
                  <View style={[styles.badgeIconCircle, badge.unlocked ? { backgroundColor: badge.color + '20' } : { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name={badge.icon as any} size={28} color={badge.unlocked ? badge.color : '#9CA3AF'} />
                     {!badge.unlocked && <View style={styles.lockIcon}><MaterialCommunityIcons name="lock" size={10} color="#FFF" /></View>}
                  </View>
                  <Text style={[styles.badgeTitle, !badge.unlocked && { color: '#9CA3AF' }]} numberOfLines={1}>{badge.title}</Text>
                  <View style={[styles.eventTag, { backgroundColor: badge.color + '20' }]}><Text style={[styles.eventTagText, { color: badge.color }]}>EVENTO</Text></View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Todos PRs */}
      <Modal visible={isAllPRsOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsAllPRsOpen(false)}>
        <View style={styles.fullScreenModal}>
          <View style={[styles.fullScreenHeader, { paddingTop: insets.top + 10 }]}>
             <Text style={styles.fullScreenTitle}>Recordes Pessoais</Text>
             <TouchableOpacity onPress={() => setIsAllPRsOpen(false)} style={styles.closeRoundBtn}><MaterialCommunityIcons name="close" size={24} color="#191511" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <View style={styles.prList}>
              {PERSONAL_RECORDS.map((pr, index) => (
                <TouchableOpacity key={index} style={styles.prCard} onPress={() => setSelectedPR(pr)}>
                  <View style={styles.prInfo}>
                    <Text style={styles.prExercise}>{pr.exercise}</Text>
                    <Text style={styles.prDate}>{pr.date}</Text>
                  </View>
                  <View style={styles.prValueContainer}>
                    <Text style={styles.prWeight}>{pr.weight}</Text>
                    {pr.isNew && <View style={styles.newPrBadge}><Text style={styles.newPrText}>NOVO</Text></View>}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" style={{marginLeft: 8}} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Detalhe PR */}
      <Modal visible={!!selectedPR} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedPR(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedPR(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderPR}>
               <View style={styles.prIconBoxLarge}><MaterialCommunityIcons name="weight-lifter" size={32} color="#008E00" /></View>
               <View style={{flex: 1}}><Text style={styles.modalTitlePR}>{selectedPR?.exercise}</Text><Text style={styles.modalSubtitlePR}>Recorde Atual: {selectedPR?.weight}</Text></View>
            </View>
            <View style={styles.chartWrapper}>
               <Text style={styles.chartLabel}>Evolução de Carga</Text>
               <LineChart data={selectedPR?.history} color="#008E00" />
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedPR(null)}><Text style={styles.modalCloseText}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- NOVO: MODAL DETALHE DE BIOIMPEDÂNCIA --- */}
      <Modal visible={!!selectedBioMetric} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedBioMetric(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedBioMetric(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderPR}>
               <View style={[styles.prIconBoxLarge, {backgroundColor: selectedBioMetric?.color + '20'}]}>
                 <MaterialCommunityIcons name="chart-line" size={32} color={selectedBioMetric?.color} />
               </View>
               <View style={{flex: 1}}>
                 <Text style={styles.modalTitlePR}>{selectedBioMetric?.title}</Text>
                 <Text style={styles.modalSubtitlePR}>Histórico de Evolução</Text>
               </View>
            </View>
            <View style={styles.chartWrapper}>
               <LineChart 
                  data={selectedBioMetric?.history} 
                  color={selectedBioMetric?.color} 
                  unit={selectedBioMetric?.unit}
               />
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedBioMetric(null)}><Text style={styles.modalCloseText}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  
  // HEADER
  header: {
    backgroundColor: '#191511',
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },

  levelCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  levelBadge: { 
    width: 64, height: 64, borderRadius: 32, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center', 
    position: 'relative', 
    borderWidth: 2, borderColor: '#F59E0B' 
  },
  levelPill: {
    position: 'absolute',
    bottom: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#008E00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#191511'
  },
  levelNumber: { 
    color: '#FFF', fontWeight: '800', fontSize: 10 
  },

  levelTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  xpRow: { marginBottom: 8 },
  xpTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#008E00', borderRadius: 4 },
  xpValues: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', alignSelf: 'flex-end' },
  badgeCountText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

  scrollContent: { padding: 24, paddingTop: 32 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
  seeAllText: { fontSize: 12, fontWeight: '700', color: '#008E00' },

  // --- STYLES PARA EVOLUÇÃO CORPORAL ---
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 20, padding: 3 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  toggleBtnActive: { backgroundColor: '#FFF' },
  toggleText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#191511', fontWeight: '800' },
  
  weightCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  currentWeightTitle: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  currentWeightValue: { fontSize: 28, fontWeight: '800', color: '#191511' },
  
  advancedStatsContainer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#F9FAFB', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  advancedTitle: { fontSize: 12, fontWeight: '700', color: '#191511', marginBottom: 12 },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  
  // --- CORREÇÃO DE LARGURA PARA 2 COLUNAS ---
  bioCard: { 
    width: (width - 48 - 32 - 14) / 2, // width - (screen padding*2) - (container padding*2) - (gap buffer) / 2
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    gap: 10 
  },
  
  bioIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  bioValue: { fontSize: 16, fontWeight: '800', color: '#191511' },
  bioUnit: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  bioTitle: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },

  // BADGES GRID
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeItem: { width: (width - 48 - 24) / 3, aspectRatio: 0.85, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 8, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  badgeLocked: { opacity: 0.8, backgroundColor: '#FAFAFA' },
  badgeIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  badgeTitle: { fontSize: 12, fontWeight: '700', color: '#191511', textAlign: 'center' },
  lockIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#9CA3AF', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FAFAFA' },
  miniProgressTrack: { width: '80%', height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginTop: 6 },
  miniProgressFill: { height: '100%', backgroundColor: '#9CA3AF', borderRadius: 2 },
  eventTag: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  eventTagText: { fontSize: 8, fontWeight: '800' },

  // PR LIST
  prList: { gap: 12 },
  prCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  prInfo: { flex: 1 },
  prExercise: { fontSize: 16, fontWeight: '700', color: '#191511', marginBottom: 2 },
  prDate: { fontSize: 12, color: '#9CA3AF' },
  prValueContainer: { alignItems: 'flex-end' },
  prWeight: { fontSize: 18, fontWeight: '800', color: '#008E00' },
  newPrBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  newPrText: { fontSize: 8, fontWeight: '800', color: '#FFF' },

  // MODAL GERAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 32, alignItems: 'center' },
  modalIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#191511', marginBottom: 8, textAlign: 'center' },
  modalStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 },
  modalStatusText: { fontSize: 12, fontWeight: '800' },
  modalDesc: { fontSize: 16, color: '#4B5563', textAlign: 'center', lineHeight: 22 },
  modalCloseBtn: { marginTop: 32, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#191511', borderRadius: 12 },
  modalCloseText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  eventBadgeTag: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  eventBadgeText: { fontSize: 10, fontWeight: '800', color: '#D97706' },

  // MODAL PR CHART ESPECÍFICO
  modalHeaderPR: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24, gap: 16 },
  prIconBoxLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  modalTitlePR: { fontSize: 20, fontWeight: '800', color: '#191511' },
  modalSubtitlePR: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  chartWrapper: { width: '100%', backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, alignItems: 'center' },
  chartLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, alignSelf: 'flex-start' },

  // MODAL FULL SCREEN (VER MAIS)
  fullScreenModal: { flex: 1, backgroundColor: '#FAFAFA' },
  fullScreenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFF' },
  fullScreenTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },
  closeRoundBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },
  subHeaderList: { fontSize: 16, fontWeight: '800', color: '#6B7280', marginBottom: 16, marginTop: 10 },
});