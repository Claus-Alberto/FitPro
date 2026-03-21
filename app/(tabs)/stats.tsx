import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

// --- IMPORTS PARA COMPARTILHAMENTO ---
import * as Sharing from 'expo-sharing';
import ViewShot from "react-native-view-shot";

const { width } = Dimensions.get('window');

// --- DADOS MOCKADOS ---

// 1. DADOS DO RADAR (Equilíbrio Muscular 0-100)
const MUSCLE_RADAR_DATA = [
  { label: 'Peito', value: 80 },
  { label: 'Costas', value: 70 },
  { label: 'Pernas', value: 60 },
  { label: 'Ombros', value: 85 },
  { label: 'Braços', value: 90 },
  { label: 'Core', value: 50 },
];

// 2. DADOS DO RADAR DE MEDIDAS (Simetria Corporal 0-100) - NOVO
const MEASURES_RADAR_DATA = [
    { label: 'Peitoral', value: 75 },
  { label: 'Bíceps Direito', value: 90 },
  { label: 'Coxa Direita', value: 85 },
  { label: 'Pantur. Direita', value: 75 },
  { label: 'Cintura', value: 50 },
  { label: 'Pantur. Esquerda', value: 75 },
  { label: 'Coxa Esquerda', value: 85 },
  { label: 'Bíceps Esquerdo', value: 90 },
];

// 3. DADOS DO HEATMAP
const HEATMAP_DATA = Array.from({ length: 14 * 7 }, () => Math.floor(Math.random() * 4)); 

// 4. DADOS DE VOLUME SEMANAL
const VOLUME_DATA = [
  { week: 'S1', volume: 8.5 },
  { week: 'S2', volume: 9.2 },
  { week: 'S3', volume: 8.0 },
  { week: 'S4', volume: 10.5 },
  { week: 'S5', volume: 11.2 },
  { week: 'Atual', volume: 12.4 },
];

// 5. DADOS INICIAIS DE MEDIDAS
const INITIAL_BODY_MEASURES = [
  { id: 1, name: 'Bíceps (Dir)', current: '42.5', unit: 'cm', diff: '+0.5', history: [40, 40.5, 41, 41.8, 42, 42.5] },
  { id: 2, name: 'Peitoral', current: '108', unit: 'cm', diff: '+2.0', history: [102, 104, 105, 106, 107, 108] },
  { id: 3, name: 'Cintura', current: '82', unit: 'cm', diff: '-1.5', history: [88, 86, 85, 84, 83, 82], isLoss: true }, 
  { id: 4, name: 'Coxa (Dir)', current: '62', unit: 'cm', diff: '+1.0', history: [58, 59, 60, 60.5, 61, 62] },
  { id: 5, name: 'Panturrilha', current: '38', unit: 'cm', diff: '0.0', history: [38, 38, 38, 38, 38, 38] },
];

// --- COMPONENTES AUXILIARES ---

// 1. RADAR CHART
const RadarChart = ({ data }: { data: { label: string, value: number }[] }) => {
  const size = width * 0.8; 
  const center = size / 2;
  const radius = (size - 100) / 2; 
  const angleStep = (Math.PI * 2) / data.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2; 
    const x = center + Math.cos(angle) * (radius * (value / 100));
    const y = center + Math.sin(angle) * (radius * (value / 100));
    return { x, y };
  };

  const dataPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(d.value, i);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [33, 66, 100].map(level => 
    data.map((_, i) => {
      const { x, y } = getCoordinates(level, i);
      return `${x},${y}`;
    }).join(' ')
  );

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={size} height={size}>
        {gridLevels.map((points, i) => (
          <Polygon key={i} points={points} stroke="#E5E7EB" strokeWidth="1" fill="none" />
        ))}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="1" />;
        })}
        <Polygon points={dataPoints} fill="rgba(0, 142, 0, 0.2)" stroke="#008E00" strokeWidth="2" />
        {data.map((d, i) => {
          const { x, y } = getCoordinates(d.value, i);
          return <Circle key={i} cx={x} cy={y} r="4" fill="#008E00" />;
        })}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(115, i); 
          return (
            <SvgText
              key={i}
              x={x}
              y={y}
              fontSize="10"
              fontWeight="bold"
              fill="#6B7280"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

// 2. HEATMAP
const HeatMap = ({ onSelect, selectedIndex }: { onSelect?: (index: number) => void, selectedIndex: number | null }) => {
  const boxSize = 12;
  const gap = 4;
  const days = 14; 
  const colors = ['#F3F4F6', '#BBF7D0', '#4ADE80', '#15803D'];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: (boxSize + gap) * days, gap: gap }}>
      {HEATMAP_DATA.map((intensity, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelect && onSelect(index)}
          activeOpacity={0.7}
          disabled={!onSelect}
          style={{
            width: boxSize,
            height: boxSize,
            backgroundColor: colors[intensity],
            borderRadius: 2,
            borderWidth: selectedIndex === index ? 1 : 0,
            borderColor: selectedIndex === index ? '#191511' : 'transparent',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: selectedIndex === index ? 0.3 : 0,
            shadowRadius: 1,
            elevation: selectedIndex === index ? 2 : 0,
          }}
        />
      ))}
    </View>
  );
};

// 3. BAR CHART
const VolumeChart = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const chartHeight = 120;
  const barWidth = 24;
  const spacing = 20;
  const maxVal = Math.max(...VOLUME_DATA.map(d => d.volume));

  return (
    <View>
       <View style={{ marginBottom: 15, alignItems: 'center', height: 24, justifyContent: 'center' }}>
         {selectedIndex !== null ? (
           <Text style={{ fontSize: 14, fontWeight: '800', color: '#008E00' }}>
             {VOLUME_DATA[selectedIndex].week}: <Text style={{color: '#191511'}}>{VOLUME_DATA[selectedIndex].volume} Toneladas</Text>
           </Text>
         ) : (
           <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Toque nas barras para ver detalhes</Text>
         )}
       </View>

       <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartHeight + 30, justifyContent: 'center', gap: spacing }}>
        {VOLUME_DATA.map((item, index) => {
          const isSelected = selectedIndex === index;
          const barHeight = (item.volume / maxVal) * chartHeight;
          const isActive = selectedIndex === null || isSelected;

          return (
            <TouchableOpacity 
              key={index} 
              style={{ alignItems: 'center', gap: 6 }}
              activeOpacity={0.8}
              onPress={() => setSelectedIndex(index === selectedIndex ? null : index)}
            >
              <View 
                style={{ 
                  width: barWidth, 
                  height: barHeight, 
                  backgroundColor: isSelected ? '#008E00' : (item.week === 'Atual' ? '#191511' : '#E5E7EB'), 
                  borderRadius: 4,
                  opacity: isActive ? 1 : 0.4 
                }} 
              />
              <Text style={{ fontSize: 10, color: isSelected ? '#008E00' : '#9CA3AF', fontWeight: isSelected ? '800' : '700' }}>{item.week}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// 4. SPARKLINE
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const height = 40;
  const width = 80;
  const min = Math.min(...data);
  const max = Math.max(...data);
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    </Svg>
  );
};

// 5. GRÁFICO DE LINHA DETALHADO (Para o Modal)
const LineChart = ({ data, color = "#008E00", unit = "cm" }: { data: { date?: string, value: number }[], color?: string, unit?: string }) => {
  const chartHeight = 180;
  const chartWidth = width - 80;
  const padding = 20;

  if (!data || data.length === 0) return null;

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values) * 1.02; 
  const minValue = Math.min(...values) * 0.98;
  
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
            {/* Mock de data simples para o eixo X */}
            <SvgText x={getX(i)} y={chartHeight} fill="#9CA3AF" fontSize="10" textAnchor="middle">{`Mês ${i+1}`}</SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'performance' | 'measures'>('performance');
  
  // Estados de Modais
  const [isVolumeInfoOpen, setIsVolumeInfoOpen] = useState(false);
  const [isConsistencyInfoOpen, setIsConsistencyInfoOpen] = useState(false); 
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false); 
  // NOVO: Estado para Modal de Detalhes da Medida
  const [selectedBodyMeasure, setSelectedBodyMeasure] = useState<any>(null);

  // Estados de Dados
  const [selectedHeatmapIndex, setSelectedHeatmapIndex] = useState<number | null>(null);
  const [bodyMeasures, setBodyMeasures] = useState(INITIAL_BODY_MEASURES);
  
  // Estados para Nova Medição
  const [selectedMeasureId, setSelectedMeasureId] = useState<number | null>(null);
  const [newMeasureValue, setNewMeasureValue] = useState('');

  // Compartilhamento
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  const getHeatmapDayText = (index: number | null) => {
    if (index === null) return "Você treinou em 82% dos dias este mês. 🔥";
    const intensity = HEATMAP_DATA[index];
    const labels = ["Descanso", "Treino Leve", "Treino Médio", "Treino Intenso"];
    const colors = ['#6B7280', '#008E00', '#008E00', '#008E00'];
    const today = new Date();
    const daysAgo = (HEATMAP_DATA.length - 1) - index;
    const date = new Date();
    date.setDate(today.getDate() - daysAgo);
    const dateString = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return (
      <Text style={{fontWeight: '400'}}>
        {dateString}: <Text style={{fontWeight: '800', color: colors[intensity]}}>{labels[intensity]}</Text>
      </Text>
    );
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setTimeout(async () => {
      try {
        const uri = await viewShotRef.current?.capture();
        if (uri) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Compartilhar Estatísticas FitPro',
            UTI: 'image/png'
          });
        }
      } catch (error) {
        console.error("Erro ao compartilhar", error);
      } finally {
        setIsSharing(false);
      }
    }, 100);
  };

  const handleOpenMeasureModal = () => {
    setSelectedMeasureId(bodyMeasures[0].id); 
    setNewMeasureValue('');
    setIsMeasureModalOpen(true);
  };

  const handleSaveMeasure = () => {
    if (!newMeasureValue || !selectedMeasureId) return;

    const valueFloat = parseFloat(newMeasureValue.replace(',', '.'));
    if (isNaN(valueFloat)) return;

    const updatedMeasures = bodyMeasures.map(item => {
      if (item.id === selectedMeasureId) {
        const previousValue = parseFloat(item.current);
        const diffVal = valueFloat - previousValue;
        const diffStr = diffVal > 0 ? `+${diffVal.toFixed(1)}` : diffVal.toFixed(1);

        return {
          ...item,
          current: valueFloat.toString(),
          diff: diffStr,
          history: [...item.history, valueFloat]
        };
      }
      return item;
    });

    setBodyMeasures(updatedMeasures);
    setIsMeasureModalOpen(false);
  };

  // Função para abrir o detalhe da medida
  const handleOpenMeasureDetails = (measure: any) => {
    setSelectedBodyMeasure(measure);
  };

  const selectedMeasureObj = bodyMeasures.find(m => m.id === selectedMeasureId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* TEMPLATE SHARE (OFF-SCREEN) */}
      <View style={{ position: 'absolute', left: -2000, top: 0, opacity: 0 }}> 
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.95 }}>
            <View style={styles.shareTemplateContainer}>
                <View style={styles.shareHeader}>
                   <MaterialCommunityIcons name="lightning-bolt" size={40} color="#008E00" />
                   <Text style={styles.shareAppName}>FITPRO</Text>
                </View>
                <Text style={styles.shareTitle}>Estatísticas de Performance</Text>
                <View style={styles.shareInfoBox}>
                    <Text style={styles.shareUserName}>Claus</Text>
                    <Text style={styles.shareUserLevel}>Nível 12 • Titã em Ascensão</Text>
                </View>
                <View style={styles.shareCard}>
                    <Text style={styles.shareCardTitle}>Equilíbrio Muscular</Text>
                    <RadarChart data={MUSCLE_RADAR_DATA} />
                </View>
                <View style={styles.shareCard}>
                    <Text style={styles.shareCardTitle}>Consistência</Text>
                    <View style={{alignItems: 'center', marginVertical: 10}}>
                       <HeatMap onSelect={() => {}} selectedIndex={null} />
                    </View>
                    <Text style={{color: '#6B7280', fontSize: 12, textAlign: 'center'}}>82% de Frequência este mês 🔥</Text>
                </View>
                <View style={{flex: 1}} />
                <Text style={styles.shareFooterText}>#FitProApp</Text>
            </View>
        </ViewShot>
      </View>

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#191511" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estatísticas</Text>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={handleShare}
            disabled={isSharing}
          >
             {isSharing ? <ActivityIndicator size="small" color="#191511" /> : <MaterialCommunityIcons name="share-variant" size={20} color="#191511" />}
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
           <TouchableOpacity 
             style={[styles.tabBtn, activeTab === 'performance' && styles.tabBtnActive]}
             onPress={() => setActiveTab('performance')}
           >
              <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>Performance</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.tabBtn, activeTab === 'measures' && styles.tabBtnActive]}
             onPress={() => setActiveTab('measures')}
           >
              <Text style={[styles.tabText, activeTab === 'measures' && styles.tabTextActive]}>Medidas</Text>
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {activeTab === 'performance' ? (
          <>
            <View style={styles.card}>
               <View style={styles.cardHeader}>
                 <Text style={styles.cardTitle}>Equilíbrio Muscular</Text>
                 <MaterialCommunityIcons name="spider-web" size={20} color="#9CA3AF" />
               </View>
               <RadarChart data={MUSCLE_RADAR_DATA} />
               <View style={styles.insightBox}>
                 <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#F59E0B" />
                 <Text style={styles.insightText}>Seus <Text style={{fontWeight:'700'}}>membros inferiores</Text> estão ficando para trás. Que tal adicionar mais um exercício de Agachamento?</Text>
               </View>
            </View>

            <View style={styles.card}>
               <View style={styles.cardHeader}>
                 <View><Text style={styles.cardTitle}>Volume de Carga (Ton)</Text><Text style={styles.cardSub}>+12% vs. mês passado</Text></View>
                 <TouchableOpacity onPress={() => setIsVolumeInfoOpen(true)} style={{padding: 4}}><MaterialCommunityIcons name="information-outline" size={22} color="#9CA3AF" /></TouchableOpacity>
               </View>
               <VolumeChart />
            </View>

            <View style={styles.card}>
               <View style={styles.cardHeader}>
                 <Text style={styles.cardTitle}>Consistência</Text>
                 <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                    <TouchableOpacity onPress={() => setIsConsistencyInfoOpen(true)}><MaterialCommunityIcons name="information-outline" size={22} color="#9CA3AF" /></TouchableOpacity>
                    <View style={{flexDirection:'row', alignItems:'center', gap:4}}><View style={{width:10, height:10, backgroundColor:'#15803D', borderRadius:2}}/><Text style={styles.legendText}>Intenso</Text></View>
                 </View>
               </View>
               <View style={{alignItems:'center', marginTop: 10}}><HeatMap onSelect={setSelectedHeatmapIndex} selectedIndex={selectedHeatmapIndex} /></View>
               <Text style={styles.heatmapFooter}>{getHeatmapDayText(selectedHeatmapIndex)}</Text>
            </View>
          </>
        ) : (
          <View style={styles.measuresContainer}>
            {/* NOVO: RADAR DE MEDIDAS (SIMETRIA) */}
            <View style={styles.card}>
               <View style={styles.cardHeader}>
                 <Text style={styles.cardTitle}>Simetria Corporal</Text>
                 <MaterialCommunityIcons name="human" size={20} color="#9CA3AF" />
               </View>
               <RadarChart data={MEASURES_RADAR_DATA} />
            </View>

            {bodyMeasures.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.measureCard}
                onPress={() => handleOpenMeasureDetails(item)}
                activeOpacity={0.7}
              >
                 <View style={{flex: 1}}>
                    <Text style={styles.measureName}>{item.name}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 6}}>
                       <Text style={styles.measureValue}>{item.current} <Text style={{fontSize: 14, color: '#9CA3AF'}}>{item.unit}</Text></Text>
                       <Text style={[
                         styles.measureDiff, 
                         { color: item.isLoss ? '#008E00' : (parseFloat(item.diff) > 0 ? '#008E00' : '#EF4444') }
                       ]}>
                         {item.diff} {item.unit}
                       </Text>
                    </View>
                 </View>
                 <View style={{alignItems: 'flex-end', gap: 4}}>
                    <Sparkline data={item.history} color={item.isLoss ? '#008E00' : (parseFloat(item.diff) > 0 ? '#008E00' : '#EF4444')} />
                    <Text style={{fontSize: 10, color: '#9CA3AF', marginTop: 4}}>Ver Histórico</Text>
                 </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.addMeasureBtn} onPress={handleOpenMeasureModal}>
               <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
               <Text style={styles.addMeasureText}>Nova Medição</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- MODAIS --- */}
      
      {/* Volume Info */}
      <Modal visible={isVolumeInfoOpen} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setIsVolumeInfoOpen(false)}><View style={styles.modalOverlay}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsVolumeInfoOpen(false)} /><View style={styles.modalContent}><View style={styles.modalIconCircle}><MaterialCommunityIcons name="weight-lifter" size={32} color="#008E00" /></View><Text style={styles.modalTitle}>O que é Volume de Carga?</Text><Text style={styles.modalText}>Também conhecido como <Text style={{fontWeight:'700'}}>Tonelagem</Text>, é a soma total do peso levantado em todos os seus treinos da semana.</Text><View style={styles.formulaBox}><Text style={styles.formulaText}>Séries × Repetições × Carga (kg)</Text></View><Text style={styles.modalText}>Aumentar esse número ao longo do tempo é um dos melhores indicadores de que você está aplicando a <Text style={{fontWeight:'700'}}>Sobrecarga Progressiva</Text> e ganhando força! 💪</Text><TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsVolumeInfoOpen(false)}><Text style={styles.modalCloseText}>Entendi</Text></TouchableOpacity></View></View></Modal>
      
      {/* Consistency Info */}
      <Modal visible={isConsistencyInfoOpen} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setIsConsistencyInfoOpen(false)}><View style={styles.modalOverlay}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsConsistencyInfoOpen(false)} /><View style={styles.modalContent}><View style={[styles.modalIconCircle, {backgroundColor: '#E3F9E5'}]}><MaterialCommunityIcons name="calendar-check" size={32} color="#15803D" /></View><Text style={styles.modalTitle}>Sua Consistência</Text><Text style={styles.modalText}>Este mapa mostra a frequência e intensidade dos seus treinos nos últimos 3 meses.</Text><View style={{alignSelf: 'flex-start', marginTop: 16, width: '100%', paddingHorizontal: 20}}><View style={styles.legendRow}><View style={[styles.legendBox, {backgroundColor: '#F3F4F6'}]} /><Text style={styles.legendLabel}>Descanso / Falta</Text></View><View style={styles.legendRow}><View style={[styles.legendBox, {backgroundColor: '#BBF7D0'}]} /><Text style={styles.legendLabel}>Treino Leve</Text></View><View style={styles.legendRow}><View style={[styles.legendBox, {backgroundColor: '#4ADE80'}]} /><Text style={styles.legendLabel}>Treino Médio</Text></View><View style={styles.legendRow}><View style={[styles.legendBox, {backgroundColor: '#15803D'}]} /><Text style={styles.legendLabel}>Treino Intenso 🔥</Text></View></View><Text style={[styles.modalText, {marginTop: 16, fontSize: 13, fontStyle:'italic'}]}>"A constância vence a intensidade." Tente evitar "buracos" brancos no seu mapa!</Text><TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsConsistencyInfoOpen(false)}><Text style={styles.modalCloseText}>Entendi</Text></TouchableOpacity></View></View></Modal>

      {/* NOVO: Modal de Nova Medição */}
      <Modal visible={isMeasureModalOpen} transparent={true} animationType="slide" statusBarTranslucent onRequestClose={() => setIsMeasureModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={styles.modalKeyboardContainer}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsMeasureModalOpen(false)} activeOpacity={1}><View style={styles.modalBackdropLayer} /></TouchableOpacity>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <Text style={styles.modalTitleLeft}>Nova Medição</Text>
               <TouchableOpacity onPress={() => setIsMeasureModalOpen(false)}><MaterialCommunityIcons name="close" size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <View style={{ height: 40, marginBottom: 24 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {bodyMeasures.map((measure) => {
                  const isSelected = selectedMeasureId === measure.id;
                  return (
                    <TouchableOpacity key={measure.id} style={[styles.measureChip, isSelected && styles.measureChipActive]} onPress={() => setSelectedMeasureId(measure.id)}>
                      <Text style={[styles.measureChipText, isSelected && styles.measureChipTextActive]}>{measure.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
               <Text style={styles.inputLabelSmall}>NOVO VALOR</Text>
               <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                 <TextInput style={styles.measureInput} value={newMeasureValue} onChangeText={setNewMeasureValue} keyboardType="numeric" placeholder="0.0" placeholderTextColor="#E5E7EB" autoFocus={true} />
                 <Text style={styles.measureUnitText}>{selectedMeasureObj?.unit}</Text>
               </View>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMeasure}><Text style={styles.saveBtnText}>REGISTRAR</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* NOVO: Modal de Detalhes da Medida (Gráfico Histórico) */}
      <Modal visible={!!selectedBodyMeasure} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedBodyMeasure(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedBodyMeasure(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderPR}>
               <View style={styles.prIconBoxLarge}><MaterialCommunityIcons name="tape-measure" size={32} color="#008E00" /></View>
               <View style={{flex: 1}}>
                 <Text style={styles.modalTitlePR}>{selectedBodyMeasure?.name}</Text>
                 <Text style={styles.modalSubtitlePR}>Atual: {selectedBodyMeasure?.current} {selectedBodyMeasure?.unit}</Text>
               </View>
            </View>
            
            <View style={styles.chartWrapper}>
               <Text style={styles.chartLabel}>Histórico de Evolução</Text>
               {selectedBodyMeasure && (
                 <LineChart 
                    // Transforma o array de números em objetos {value, date} para o gráfico
                    data={selectedBodyMeasure.history.map((val: number, i: number) => ({
                      value: val,
                      date: `Mês ${i+1}` // Mock date
                    }))} 
                    unit={selectedBodyMeasure.unit}
                    color="#008E00"
                 />
               )}
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedBodyMeasure(null)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#191511', fontWeight: '800' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity:0.02, shadowRadius:8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#191511' },
  cardSub: { fontSize: 12, fontWeight: '600', color: '#008E00' },
  insightBox: { flexDirection: 'row', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, gap: 10, marginTop: 10, borderWidth: 1, borderColor: '#FEF3C7' },
  insightText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  legendText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  heatmapFooter: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 16, fontWeight: '500' },
  measuresContainer: { gap: 12 },
  measureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  measureName: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  measureValue: { fontSize: 20, color: '#191511', fontWeight: '800' },
  measureDiff: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
  addMeasureBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#191511', paddingVertical: 16, borderRadius: 16, gap: 8, marginTop: 12 },
  addMeasureText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 32, alignItems: 'center' },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#191511', marginBottom: 12, textAlign: 'center' },
  modalText: { fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 22 },
  formulaBox: { backgroundColor: '#F3F4F6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginVertical: 16 },
  formulaText: { fontSize: 16, fontWeight: '700', color: '#191511' },
  modalCloseBtn: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#191511', borderRadius: 12 },
  modalCloseText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  legendBox: { width: 16, height: 16, borderRadius: 4 },
  legendLabel: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  shareTemplateContainer: { width: 375, height: 667, backgroundColor: '#191511', position: 'relative', padding: 32, alignItems: 'center' },
  shareHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  shareAppName: { fontSize: 28, fontWeight: '900', color: '#FFF', fontStyle: 'italic', letterSpacing: 2 },
  shareTitle: { fontSize: 18, color: '#9CA3AF', fontWeight: '700', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },
  shareInfoBox: { marginTop: 32, alignItems: 'center' },
  shareUserName: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  shareUserLevel: { fontSize: 16, color: '#008E00', fontWeight: '700', marginTop: 4 },
  shareStatsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 24 },
  shareStatLabel: { color: '#6B7280', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  shareStatValue: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  shareCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginTop: 24 },
  shareCardTitle: { fontSize: 16, fontWeight: '800', color: '#191511', textAlign: 'center', marginBottom: 12 },
  shareConsistency: { width: '100%', marginTop: 32, alignItems: 'center' },
  shareSectionTitle: { color: '#9CA3AF', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  shareFooterText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  modalKeyboardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBackdropLayer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalTitleLeft: { fontSize: 20, fontWeight: '800', color: '#191511' },
  measureChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  measureChipActive: { backgroundColor: '#F0FDF4', borderColor: '#008E00' },
  measureChipText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  measureChipTextActive: { color: '#008E00', fontWeight: '700' },
  measureInput: { fontSize: 48, fontWeight: '900', color: '#191511', borderBottomWidth: 2, borderBottomColor: '#F3F4F6', minWidth: 100, textAlign: 'center' },
  measureUnitText: { fontSize: 24, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, marginLeft: 8 },
  inputLabelSmall: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 16, letterSpacing: 1 },
  saveBtn: { backgroundColor: '#008E00', borderRadius: 16, paddingVertical: 16, alignItems: 'center', width: '100%' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },

  // --- STYLES MODAL DETALHE MEDIDA ---
  modalHeaderPR: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24, gap: 16 },
  prIconBoxLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  modalTitlePR: { fontSize: 20, fontWeight: '800', color: '#191511' },
  modalSubtitlePR: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  chartWrapper: { width: '100%', backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, alignItems: 'center' },
  chartLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, alignSelf: 'flex-start' },
});