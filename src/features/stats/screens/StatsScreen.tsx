import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

import BottomSheetModal from '../../../components/BottomSheetModal';
import LineChart from '../../../components/LineChart';
import RadarChart from '../../../components/RadarChart';
import Sparkline from '../../../components/Sparkline';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import STRINGS from '../../../constants/strings.json';
import MetricDetailModal from '../components/MetricDetailModal';
import NewMeasurementModal from '../components/NewMeasurementModal';
import { BODY_METRICS, HeatmapDay, MEASURE_METRICS, MetricConfig, useStats, VolumeWeek } from '../hooks/useStats';
import { MetricKey, MetricPoint } from '../services/BodyMetricsService';
import { formatShortDatePt } from '../utils';

type Tab = 'performance' | 'body' | 'measures';

// Cores do heatmap de Consistência: nível 0 (sem treino) até 3 (treino intenso), sempre derivadas
// do verde de marca via opacidade — evita 4 hex soltos sem relação com o design system.
const HEATMAP_LEVEL_COLORS = [COLORS.gray100, `${COLORS.primary}40`, `${COLORS.primary}90`, COLORS.primary];

/** @description Grade de 14x7 dias mostrando a intensidade de treino de cada dia (ver `useStats`/`getMonthHistory`). */
const ConsistencyHeatmap = ({
  data,
  onSelect,
  selectedIndex,
}: {
  data: HeatmapDay[];
  onSelect: (index: number) => void;
  selectedIndex: number | null;
}) => {
  const boxSize = 12;
  const boxGapRight = 4;
  const columns = 14;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: (boxSize + boxGapRight) * columns }}>
      {data.map((day, index) => (
        <TouchableOpacity
          key={day.date}
          onPress={() => onSelect(index)}
          activeOpacity={0.7}
          style={[
            styles.heatmapCell,
            {
              width: boxSize,
              height: boxSize,
              marginRight: boxGapRight,
              marginBottom: boxGapRight,
              backgroundColor: HEATMAP_LEVEL_COLORS[day.level],
              borderWidth: selectedIndex === index ? 1 : 0,
              borderColor: COLORS.secondary,
            },
          ]}
        />
      ))}
    </View>
  );
};

/** @description Gráfico de barras do volume semanal, com seleção por toque pra ver o valor exato. */
const VolumeBarChart = ({ data }: { data: VolumeWeek[] }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const chartHeight = 120;
  const barWidth = 24;
  const maxVal = Math.max(...data.map((d) => d.volumeKg), 1);
  const selected = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View>
      <View style={styles.volumeHint}>
        {selected ? (
          <Text style={styles.volumeHintSelected}>
            {selected.isCurrent ? STRINGS.stats.performance.volume.current : selected.label}:{' '}
            <Text style={styles.volumeHintValue}>{selected.volumeKg} {STRINGS.stats.performance.volume.unit}</Text>
          </Text>
        ) : (
          <Text style={styles.volumeHintIdle}>{STRINGS.stats.performance.volume.hint}</Text>
        )}
      </View>

      <View style={styles.volumeBars}>
        {data.map((item, index) => {
          const isSelected = selectedIndex === index;
          const barHeight = Math.max((item.volumeKg / maxVal) * chartHeight, 2);
          const isDimmed = selectedIndex !== null && !isSelected;

          return (
            <TouchableOpacity
              key={item.label + index}
              style={styles.volumeBarColumn}
              activeOpacity={0.8}
              onPress={() => setSelectedIndex(index === selectedIndex ? null : index)}
            >
              <View
                style={[
                  styles.volumeBar,
                  {
                    width: barWidth,
                    height: barHeight,
                    backgroundColor: isSelected ? COLORS.primary : (item.isCurrent ? COLORS.secondary : COLORS.gray200),
                    opacity: isDimmed ? 0.4 : 1,
                  },
                ]}
              />
              <Text style={[styles.volumeBarLabel, isSelected && styles.volumeBarLabelActive]}>
                {item.isCurrent ? STRINGS.stats.performance.volume.current : item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/** @description Card compacto de uma métrica de bioimpedância (Gordura/Massa Magra/Água/Massa Óssea), tocável pra ver histórico. */
const BioCard = ({ metric, value, onPress }: { metric: MetricConfig; value: number | null; onPress: () => void }) => (
  <TouchableOpacity style={styles.bioCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.bioIconBg, { backgroundColor: `${metric.color}20` }]}>
      <MaterialCommunityIcons name={metric.icon as any} size={20} color={metric.color} />
    </View>
    <View>
      <Text style={styles.bioValue}>{value != null ? value : '—'} <Text style={styles.bioUnit}>{metric.unit}</Text></Text>
      <Text style={styles.bioTitle}>{metric.label}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.gray200} style={styles.bioChevron} />
  </TouchableOpacity>
);

/** @description Empty state genérico usado nos 3 cards principais quando ainda não há dado real. */
const EmptyCardState = ({ icon, title, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; text: string }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconBg}>
      <MaterialCommunityIcons name={icon} size={28} color={COLORS.gray400} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stats = useStats();

  const [activeTab, setActiveTab] = useState<Tab>('performance');
  const [isVolumeInfoOpen, setIsVolumeInfoOpen] = useState(false);
  const [isConsistencyInfoOpen, setIsConsistencyInfoOpen] = useState(false);
  const [selectedHeatmapIndex, setSelectedHeatmapIndex] = useState<number | null>(null);

  // Modal genérico de "Nova Medição" — reaproveitado pra Corpo (bioimpedância) e Medidas (circunferências).
  const [measurementModal, setMeasurementModal] = useState<{ options: MetricConfig[]; initialKey?: MetricKey } | null>(null);

  // Modal genérico de detalhe de métrica (valor atual + histórico).
  const [detailModal, setDetailModal] = useState<{ metric: MetricConfig; value: number | null; history: MetricPoint[] } | null>(null);

  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setTimeout(async () => {
      try {
        const uri = await viewShotRef.current?.capture?.();
        if (uri) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: STRINGS.stats.share.dialogTitle,
            UTI: 'image/png',
          });
        }
      } catch (error) {
        console.error('Erro ao compartilhar', error);
      } finally {
        setIsSharing(false);
      }
    }, 100);
  };

  const openBodyMetricDetail = async (metric: MetricConfig) => {
    const history = metric.key === 'weight_kg' ? stats.weightHistory : await stats.fetchMetricHistory(metric.key);
    setDetailModal({ metric, value: stats.bodyLatest[metric.key] ?? null, history });
  };

  const openMeasureDetail = (metric: MetricConfig) => {
    setDetailModal({ metric, value: stats.measuresLatest[metric.key] ?? null, history: stats.measuresHistory[metric.key] || [] });
  };

  const handleSaveMeasurement = async (key: MetricKey, value: number) => {
    await stats.logMetric(key, value);
  };

  const getHeatmapDayText = (): React.ReactNode => {
    if (selectedHeatmapIndex === null) {
      return STRINGS.stats.performance.consistency.summary.replace('{pct}', String(stats.performance.heatmapTrainedPct));
    }
    const day = stats.performance.heatmap[selectedHeatmapIndex];
    const levelLabels = STRINGS.stats.performance.consistency.levels as Record<string, string>;
    const [y, m, d] = day.date.split('-');
    return (
      <Text style={{ fontWeight: '400' }}>
        {`${d}/${m}/${y}`}: <Text style={{ fontWeight: '800', color: day.level > 0 ? COLORS.primary : COLORS.gray500 }}>{levelLabels[String(day.level)]}</Text>
      </Text>
    );
  };

  const hasAnyMeasure = MEASURE_METRICS.some((m) => stats.measuresLatest[m.key] != null);
  const measuredAxesCount = MEASURE_METRICS.filter((m) => stats.measuresLatest[m.key] != null).length;
  // Emptiness da aba Corpo considera QUALQUER métrica de bioimpedância, não só peso — um usuário
  // pode registrar gordura/massa magra antes de registrar o peso em si (ex: leitura de balança de
  // bioimpedância feita fora de ordem), e nesse caso ainda há dado real pra mostrar.
  const hasAnyBodyMetric = BODY_METRICS.some((m) => stats.bodyLatest[m.key] != null);
  const weakestAxis = stats.performance.weakestMuscleAxis;
  const weakestAxisValue = stats.performance.muscleRadar.find((a) => a.label === weakestAxis)?.value ?? 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* TEMPLATE DE COMPARTILHAMENTO (fora da tela) */}
      <View style={styles.shareTemplateHolder}>
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }}>
          <View style={styles.shareTemplateContainer}>
            <View style={styles.shareHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={40} color={COLORS.primary} />
              <Text style={styles.shareAppName}>{STRINGS.stats.share.appName}</Text>
            </View>
            <Text style={styles.shareTitle}>{STRINGS.stats.share.title}</Text>
            {stats.performance.muscleRadar.length > 0 && (
              <View style={styles.shareCard}>
                <Text style={styles.shareCardTitle}>{STRINGS.stats.performance.muscleBalance.title}</Text>
                <RadarChart data={stats.performance.muscleRadar} />
              </View>
            )}
            <View style={styles.shareCard}>
              <Text style={styles.shareCardTitle}>{STRINGS.stats.performance.consistency.title}</Text>
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <ConsistencyHeatmap data={stats.performance.heatmap} onSelect={() => {}} selectedIndex={null} />
              </View>
              <Text style={styles.shareFooterSmall}>
                {STRINGS.stats.performance.consistency.summary.replace('{pct}', String(stats.performance.heatmapTrainedPct))}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={styles.shareFooterText}>{STRINGS.stats.share.hashtag}</Text>
          </View>
        </ViewShot>
      </View>

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{STRINGS.stats.header.title}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare} disabled={isSharing}>
            {isSharing ? <ActivityIndicator size="small" color={COLORS.secondary} /> : <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.secondary} />}
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {(['performance', 'body', 'measures'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{STRINGS.stats.tabs[tab]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'performance' && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{STRINGS.stats.performance.muscleBalance.title}</Text>
                <MaterialCommunityIcons name="spider-web" size={20} color={COLORS.gray400} />
              </View>
              {stats.performance.muscleRadar.length > 0 ? (
                <>
                  <RadarChart data={stats.performance.muscleRadar} />
                  {weakestAxis && weakestAxisValue < 60 ? (
                    <View style={styles.insightBox}>
                      <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={COLORS.accent} />
                      <Text style={styles.insightText}>
                        {STRINGS.stats.performance.muscleBalance.insight.replace('{group}', weakestAxis)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.insightBox}>
                      <MaterialCommunityIcons name="check-decagram" size={20} color={COLORS.primary} />
                      <Text style={styles.insightText}>{STRINGS.stats.performance.muscleBalance.balancedInsight}</Text>
                    </View>
                  )}
                </>
              ) : (
                <EmptyCardState
                  icon="spider-web"
                  title={STRINGS.stats.performance.muscleBalance.emptyTitle}
                  text={STRINGS.stats.performance.muscleBalance.emptyText}
                />
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{STRINGS.stats.performance.volume.title}</Text>
                  {stats.performance.volumeDeltaPct !== null && (
                    <Text style={styles.cardSub}>
                      {(stats.performance.volumeDeltaPct >= 0
                        ? STRINGS.stats.performance.volume.deltaUp
                        : STRINGS.stats.performance.volume.deltaDown
                      ).replace('{pct}', String(stats.performance.volumeDeltaPct))}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setIsVolumeInfoOpen(true)} style={styles.infoBtn}>
                  <MaterialCommunityIcons name="information-outline" size={22} color={COLORS.gray400} />
                </TouchableOpacity>
              </View>
              {stats.performance.weeklyVolume.length > 0 ? (
                <VolumeBarChart data={stats.performance.weeklyVolume} />
              ) : (
                <EmptyCardState
                  icon="weight-lifter"
                  title={STRINGS.stats.performance.volume.emptyTitle}
                  text={STRINGS.stats.performance.volume.emptyText}
                />
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{STRINGS.stats.performance.consistency.title}</Text>
                <View style={styles.legendRow}>
                  <TouchableOpacity onPress={() => setIsConsistencyInfoOpen(true)} style={styles.infoBtn}>
                    <MaterialCommunityIcons name="information-outline" size={22} color={COLORS.gray400} />
                  </TouchableOpacity>
                  <View style={styles.legendItem}>
                    <View style={styles.legendBoxSmall} />
                    <Text style={styles.legendText}>{STRINGS.stats.performance.consistency.legend}</Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: 'center', marginTop: SPACING.sm }}>
                <ConsistencyHeatmap data={stats.performance.heatmap} onSelect={setSelectedHeatmapIndex} selectedIndex={selectedHeatmapIndex} />
              </View>
              <Text style={styles.heatmapFooter}>{getHeatmapDayText()}</Text>
              {stats.performance.heatmapTrainedPct === 0 && (
                <Text style={styles.heatmapCta}>{STRINGS.stats.performance.consistency.emptyFooter}</Text>
              )}
            </View>
          </>
        )}

        {activeTab === 'body' && (
          <View style={styles.tabContentGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{STRINGS.stats.body.title}</Text>
              <TouchableOpacity onPress={() => setMeasurementModal({ options: BODY_METRICS })} style={styles.addPill}>
                <MaterialCommunityIcons name="plus" size={16} color={COLORS.white} />
                <Text style={styles.addPillText}>{STRINGS.stats.body.cta}</Text>
              </TouchableOpacity>
            </View>

            {hasAnyBodyMetric ? (
              <View style={styles.weightCard}>
                <View style={styles.weightCardHeader}>
                  <Text style={styles.currentWeightTitle}>{STRINGS.stats.body.currentWeight}</Text>
                  <Text style={styles.currentWeightValue}>
                    {stats.bodyLatest['weight_kg'] ?? '—'} <Text style={styles.currentWeightUnit}>kg</Text>
                  </Text>
                </View>
                {/* Peso é a métrica em destaque, mas o usuário pode ter registrado só as outras
                    (ex: leitura de bioimpedância fora de ordem) — sem histórico de peso, não força
                    um gráfico vazio, só omite (o `LineChart` também retorna null pra data vazia). */}
                {stats.weightHistory.length > 0 && (
                  <LineChart
                    data={stats.weightHistory.map((h) => ({ date: formatShortDatePt(h.date), value: h.value }))}
                    color={COLORS.info}
                  />
                )}
                <View style={styles.advancedStatsContainer}>
                  <Text style={styles.advancedTitle}>{STRINGS.stats.body.advancedTitle}</Text>
                  <View style={styles.bioGrid}>
                    {BODY_METRICS.filter((m) => m.key !== 'weight_kg').map((metric) => (
                      <BioCard key={metric.key} metric={metric} value={stats.bodyLatest[metric.key] ?? null} onPress={() => openBodyMetricDetail(metric)} />
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <EmptyCardState icon="scale-bathroom" title={STRINGS.stats.body.emptyTitle} text={STRINGS.stats.body.emptyText} />
                <TouchableOpacity style={styles.emptyCta} onPress={() => setMeasurementModal({ options: BODY_METRICS })}>
                  <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
                  <Text style={styles.emptyCtaText}>{STRINGS.stats.body.cta}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'measures' && (
          <View style={styles.tabContentGroup}>
            {/* O radar só forma uma silhueta reconhecível com 3+ eixos preenchidos — com 1 ou 2
                medidas registradas ele desenharia um ponto ou uma linha sem sentido visual, diferente
                do radar de Equilíbrio Muscular (que sempre tem os 6 eixos fixos). Com menos que isso,
                os cards de medida abaixo já contam a história sozinhos. */}
            {measuredAxesCount >= 3 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{STRINGS.stats.measures.title}</Text>
                  <MaterialCommunityIcons name="human" size={20} color={COLORS.gray400} />
                </View>
                <RadarChart
                  data={MEASURE_METRICS.filter((m) => stats.measuresLatest[m.key] != null).map((m) => {
                    const max = Math.max(...MEASURE_METRICS.map((mm) => stats.measuresLatest[mm.key] || 0), 1);
                    return { label: m.label, value: Math.round(((stats.measuresLatest[m.key] || 0) / max) * 100) };
                  })}
                />
              </View>
            )}

            {hasAnyMeasure ? (
              MEASURE_METRICS.map((metric) => {
                const current = stats.measuresLatest[metric.key];
                const history = stats.measuresHistory[metric.key] || [];
                const previous = history.length >= 2 ? history[history.length - 2].value : null;
                const diff = current != null && previous != null ? current - previous : null;
                // Não colore a diferença como "boa"/"ruim": crescer o bíceps é ganho, crescer a
                // cintura não é — sem um sinal por medida (perímetro "quanto maior melhor" vs.
                // "quanto menor melhor") pra decidir isso com segurança, mostramos neutro.
                const diffColor = COLORS.info;
                return (
                  <TouchableOpacity key={metric.key} style={styles.measureCard} onPress={() => openMeasureDetail(metric)} activeOpacity={0.7}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.measureName}>{metric.label}</Text>
                      <View style={styles.measureValueRow}>
                        <Text style={styles.measureValue}>
                          {current != null ? current : '—'} <Text style={styles.measureUnit}>{metric.unit}</Text>
                        </Text>
                        {diff != null && (
                          <Text style={[styles.measureDiff, { color: diffColor }]}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)} {metric.unit}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.measureSparklineWrap}>
                      {history.length >= 2 ? (
                        <Sparkline data={history.slice(-6).map((h) => h.value)} color={COLORS.primary} />
                      ) : (
                        <Text style={styles.measureNoHistory}>{STRINGS.stats.measures.history}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.card}>
                <EmptyCardState icon="tape-measure" title={STRINGS.stats.measures.emptyTitle} text={STRINGS.stats.measures.emptyText} />
              </View>
            )}

            <TouchableOpacity style={styles.addMeasureBtn} onPress={() => setMeasurementModal({ options: MEASURE_METRICS })}>
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
              <Text style={styles.addMeasureText}>{STRINGS.stats.measures.addMeasurement}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAIS DE INFO */}
      <BottomSheetModal visible={isVolumeInfoOpen} onClose={() => setIsVolumeInfoOpen(false)} title={STRINGS.stats.performance.info.volumeTitle}>
        <View style={styles.infoModalIconCircle}>
          <MaterialCommunityIcons name="weight-lifter" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.infoModalText}>{STRINGS.stats.performance.info.volumeText1}</Text>
        <View style={styles.formulaBox}>
          <Text style={styles.formulaText}>{STRINGS.stats.performance.info.volumeFormula}</Text>
        </View>
        <Text style={styles.infoModalText}>{STRINGS.stats.performance.info.volumeText2}</Text>
      </BottomSheetModal>

      <BottomSheetModal visible={isConsistencyInfoOpen} onClose={() => setIsConsistencyInfoOpen(false)} title={STRINGS.stats.performance.info.consistencyTitle}>
        <View style={[styles.infoModalIconCircle, { backgroundColor: COLORS.successLight }]}>
          <MaterialCommunityIcons name="calendar-check" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.infoModalText}>{STRINGS.stats.performance.info.consistencyText1}</Text>
        <View style={styles.legendList}>
          {HEATMAP_LEVEL_COLORS.map((color, i) => (
            <View key={i} style={styles.legendRowFull}>
              <View style={[styles.legendBox, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{(STRINGS.stats.performance.consistency.levels as Record<string, string>)[String(i)]}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.infoModalText, styles.infoModalTextItalic]}>{STRINGS.stats.performance.info.consistencyText2}</Text>
      </BottomSheetModal>

      {/* MODAL NOVA MEDIÇÃO (genérico, Corpo ou Medidas) */}
      {measurementModal && (
        <NewMeasurementModal
          visible={!!measurementModal}
          onClose={() => setMeasurementModal(null)}
          options={measurementModal.options}
          initialKey={measurementModal.initialKey}
          onSave={handleSaveMeasurement}
        />
      )}

      {/* MODAL DETALHE DE MÉTRICA (genérico, Corpo ou Medidas) */}
      {detailModal && (
        <MetricDetailModal
          visible={!!detailModal}
          onClose={() => setDetailModal(null)}
          title={detailModal.metric.label}
          unit={detailModal.metric.unit}
          color={detailModal.metric.color}
          icon={detailModal.metric.icon as any}
          currentValue={detailModal.value}
          history={detailModal.history}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  iconBtn: { padding: SPACING.sm, borderRadius: 12, backgroundColor: COLORS.gray100 },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.secondary },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.gray100, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: COLORS.white, ...SHADOWS.soft },
  tabText: { ...TYPOGRAPHY.body, color: COLORS.gray400 },
  tabTextActive: { color: COLORS.secondary, fontWeight: '800' },
  scrollContent: { padding: SPACING.xl },

  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: SPACING.xl, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.gray100, ...SHADOWS.soft },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  cardTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.secondary },
  cardSub: { ...TYPOGRAPHY.caption, color: COLORS.primary, marginTop: 2 },
  infoBtn: { padding: 10, marginRight: SPACING.sm },

  insightBox: { flexDirection: 'row', backgroundColor: COLORS.warningLight, padding: SPACING.md, borderRadius: 12, marginTop: SPACING.sm },
  insightText: { flex: 1, marginLeft: SPACING.sm, fontSize: 12, color: COLORS.gray800, lineHeight: 18 },

  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendBoxSmall: { width: 10, height: 10, backgroundColor: COLORS.primary, borderRadius: 2, marginRight: 4 },
  legendText: { fontSize: 10, color: COLORS.gray500, fontWeight: '600' },
  heatmapFooter: { fontSize: 12, color: COLORS.gray500, textAlign: 'center', marginTop: SPACING.lg, fontWeight: '500' },
  heatmapCta: { fontSize: 12, color: COLORS.primary, textAlign: 'center', marginTop: SPACING.sm, fontWeight: '700' },
  heatmapCell: { borderRadius: 2 },

  volumeHint: { marginBottom: SPACING.md, alignItems: 'center', height: 24, justifyContent: 'center' },
  volumeHintSelected: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  volumeHintValue: { color: COLORS.secondary },
  volumeHintIdle: { fontSize: 12, color: COLORS.gray400, fontStyle: 'italic' },
  volumeBars: { flexDirection: 'row', alignItems: 'flex-end', height: 150, justifyContent: 'center' },
  volumeBarColumn: { alignItems: 'center', marginHorizontal: SPACING.sm, flexShrink: 0 },
  volumeBar: { borderRadius: 4 },
  volumeBarLabel: { fontSize: 10, color: COLORS.gray400, fontWeight: '700', marginTop: SPACING.xs },
  volumeBarLabelActive: { color: COLORS.primary, fontWeight: '800' },

  tabContentGroup: { flexDirection: 'column' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.secondary },
  addPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 20 },
  addPillText: { color: COLORS.white, fontSize: 12, fontWeight: '700', marginLeft: 4 },

  weightCard: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray100, ...SHADOWS.soft, marginBottom: SPACING.xl },
  weightCardHeader: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  currentWeightTitle: { fontSize: 12, color: COLORS.gray400, fontWeight: '600', textTransform: 'uppercase' },
  currentWeightValue: { fontSize: 28, fontWeight: '800', color: COLORS.secondary },
  currentWeightUnit: { fontSize: 16, color: COLORS.gray500 },
  advancedStatsContainer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.gray100, backgroundColor: COLORS.background, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  advancedTitle: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, marginBottom: SPACING.md },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  bioCard: { width: '48%', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: 12, borderWidth: 1, borderColor: COLORS.gray200, marginBottom: SPACING.md, position: 'relative' },
  bioIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  bioValue: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  bioUnit: { fontSize: 10, fontWeight: '600', color: COLORS.gray500 },
  bioTitle: { fontSize: 10, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase' },
  bioChevron: { position: 'absolute', top: SPACING.sm, right: SPACING.sm },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  emptyTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.secondary, marginBottom: 4 },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.gray400, textAlign: 'center', paddingHorizontal: SPACING.lg },
  emptyCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: 14, marginTop: SPACING.sm },
  emptyCtaText: { color: COLORS.white, fontWeight: '700', fontSize: 14, marginLeft: SPACING.sm },

  measureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray100, marginBottom: SPACING.md },
  measureName: { fontSize: 14, color: COLORS.gray500, fontWeight: '600', marginBottom: 4 },
  measureValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  measureValue: { fontSize: 20, color: COLORS.secondary, fontWeight: '800' },
  measureUnit: { fontSize: 14, color: COLORS.gray400 },
  measureDiff: { fontSize: 12, fontWeight: '700', marginLeft: SPACING.sm },
  measureSparklineWrap: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 80 },
  measureNoHistory: { fontSize: 10, color: COLORS.gray400 },

  addMeasureBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.secondary, paddingVertical: SPACING.lg, borderRadius: 16, marginTop: SPACING.sm },
  addMeasureText: { color: COLORS.white, fontWeight: '700', fontSize: 14, marginLeft: SPACING.sm },

  infoModalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg, alignSelf: 'center' },
  infoModalText: { fontSize: 15, color: COLORS.gray800, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.md },
  infoModalTextItalic: { fontSize: 13, fontStyle: 'italic' },
  formulaBox: { backgroundColor: COLORS.gray100, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: 12, marginBottom: SPACING.md, alignSelf: 'center' },
  formulaText: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  legendList: { alignSelf: 'stretch', marginBottom: SPACING.lg },
  legendRowFull: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  legendBox: { width: 16, height: 16, borderRadius: 4, marginRight: SPACING.md },
  legendLabel: { fontSize: 14, color: COLORS.gray800, fontWeight: '500' },

  shareTemplateHolder: { position: 'absolute', left: -2000, top: 0, opacity: 0 },
  shareTemplateContainer: { width: 375, height: 667, backgroundColor: COLORS.secondary, padding: SPACING.huge, alignItems: 'center' },
  shareHeader: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl },
  shareAppName: { fontSize: 28, fontWeight: '900', color: COLORS.white, fontStyle: 'italic', letterSpacing: 2, marginLeft: SPACING.sm },
  shareTitle: { fontSize: 18, color: COLORS.gray400, fontWeight: '700', marginTop: SPACING.sm, letterSpacing: 1, textTransform: 'uppercase' },
  shareCard: { width: '100%', backgroundColor: COLORS.white, borderRadius: 20, padding: SPACING.xl, marginTop: SPACING.xxl },
  shareCardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, textAlign: 'center', marginBottom: SPACING.md },
  shareFooterSmall: { color: COLORS.gray500, fontSize: 12, textAlign: 'center' },
  shareFooterText: { color: COLORS.whiteOpacity20, fontSize: 14, fontWeight: '700', marginBottom: SPACING.sm },
});
