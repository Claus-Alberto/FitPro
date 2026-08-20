import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LineChart from '../../../components/LineChart';
import STRINGS from '../../../constants/strings.json';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { AchievementBadge, ChartPoint, PersonalRecordItem, useAchievements } from '../hooks/useAchievements';

const S = STRINGS.achievements;

/**
 * @description Tela de Conquistas — 100% orientada a dado real de histórico de treino
 * (`useAchievements`). Substitui o mock antigo (nível/XP fictício, medalhas de conceitos
 * inexistentes no app como meditação/social/corrida em km, PRs fixos): todo badge mostra
 * progresso real e some quando não há como calculá-lo com o que o app rastreia hoje.
 */
export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const {
    loading,
    totalWorkouts,
    streak,
    badges,
    eventBadges,
    personalRecords,
    unlockedCount,
    totalBadgeCount,
    getExerciseHistory,
  } = useAchievements();

  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [isAllBadgesOpen, setIsAllBadgesOpen] = useState(false);
  const [isAllPRsOpen, setIsAllPRsOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PersonalRecordItem | null>(null);
  const [prHistory, setPrHistory] = useState<ChartPoint[]>([]);

  useEffect(() => {
    if (!selectedPR) {
      setPrHistory([]);
      return;
    }
    let cancelled = false;
    getExerciseHistory(selectedPR.exerciseName).then((history) => {
      if (!cancelled) setPrHistory(history);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPR, getExerciseHistory]);

  // Largura do item de medalha: 3 colunas, com um respiro fixo (SPACING.md) entre as 2 primeiras
  // colunas de cada linha — sem usar a prop `gap` do RN (ver CLAUDE.md: causou bugs reais no app).
  const badgeItemWidth = (width - SPACING.xxl * 2 - SPACING.md * 2) / 3;

  const renderBadgeItem = (badge: AchievementBadge, index: number, columns: number) => (
    <TouchableOpacity
      key={badge.id}
      style={[
        styles.badgeItem,
        { width: badgeItemWidth },
        (index + 1) % columns !== 0 && styles.badgeItemSpacing,
        !badge.unlocked && styles.badgeLocked,
      ]}
      onPress={() => setSelectedBadge(badge)}
      activeOpacity={0.8}
    >
      <View style={[styles.badgeIconCircle, badge.unlocked ? { backgroundColor: badge.color + '20' } : { backgroundColor: COLORS.gray100 }]}>
        <MaterialCommunityIcons name={badge.icon as any} size={28} color={badge.unlocked ? badge.color : COLORS.gray400} />
        {!badge.unlocked && (
          <View style={styles.lockIcon}>
            <MaterialCommunityIcons name="lock" size={10} color={COLORS.white} />
          </View>
        )}
      </View>
      <Text style={[styles.badgeTitle, !badge.unlocked && { color: COLORS.gray400 }]} numberOfLines={2}>
        {badge.title}
      </Text>
      {!badge.unlocked && (
        <View style={styles.miniProgressTrack}>
          <View style={[styles.miniProgressFill, { width: `${badge.progressPercent}%` as any }]} />
        </View>
      )}
      {badge.isEvent && (
        <View style={[styles.eventTag, { backgroundColor: badge.color + '20' }]}>
          <Text style={[styles.eventTagText, { color: badge.color }]}>{S.modal.eventTagShort}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPRCard = (pr: PersonalRecordItem) => (
    <TouchableOpacity key={pr.id} style={styles.prCard} onPress={() => setSelectedPR(pr)} activeOpacity={0.8}>
      <View style={styles.prInfo}>
        <Text style={styles.prExercise}>{pr.exerciseName}</Text>
        <Text style={styles.prDate}>{pr.date}</Text>
      </View>
      <View style={styles.prValueContainer}>
        <Text style={styles.prWeight}>{pr.weightLabel}</Text>
        {pr.isNew && (
          <View style={styles.newPrBadge}>
            <Text style={styles.newPrText}>{S.prCard.new}</Text>
          </View>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray200} style={{ marginLeft: SPACING.sm }} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          {/* `router.back()` é pouco confiável a partir de uma Tabs.Screen oculta (ver CLAUDE.md) —
              usamos replace explícito para a Home, de onde a tela sempre é alcançável via drawer. */}
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn} accessibilityLabel="Voltar" accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{S.header.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>{S.stats.workouts}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>{S.stats.streak}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedCount}/{totalBadgeCount}</Text>
            <Text style={styles.statLabel}>{S.stats.badges}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!loading && totalWorkouts === 0 && (
          <View style={styles.emptyBanner}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={28} color={COLORS.primary} />
            <Text style={styles.emptyBannerTitle}>{S.empty.noWorkoutsTitle}</Text>
            <Text style={styles.emptyBannerDesc}>{S.empty.noWorkoutsDesc}</Text>
          </View>
        )}

        {/* SEÇÃO: GALERIA DE MEDALHAS */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="medal-outline" size={20} color={COLORS.secondary} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.sectionTitle}>{S.sections.badgesTitle}</Text>
          </View>
          <TouchableOpacity onPress={() => setIsAllBadgesOpen(true)}>
            <Text style={styles.seeAllText}>{S.sections.seeMore}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgesGrid}>{badges.map((badge, index) => renderBadgeItem(badge, index, 3))}</View>

        {/* SEÇÃO: RECORDES PESSOAIS (PRs) */}
        <View style={[styles.sectionHeaderRow, { marginTop: SPACING.huge }]}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="trophy-variant-outline" size={20} color={COLORS.secondary} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.sectionTitle}>{S.sections.prTitle}</Text>
          </View>
          {personalRecords.length > 4 && (
            <TouchableOpacity onPress={() => setIsAllPRsOpen(true)}>
              <Text style={styles.seeAllText}>{S.sections.seeMore}</Text>
            </TouchableOpacity>
          )}
        </View>

        {personalRecords.length === 0 ? (
          <View style={styles.emptyBanner}>
            <MaterialCommunityIcons name="trophy-outline" size={28} color={COLORS.gray400} />
            <Text style={styles.emptyBannerTitle}>{S.empty.noPRsTitle}</Text>
            <Text style={styles.emptyBannerDesc}>{S.empty.noPRsDesc}</Text>
          </View>
        ) : (
          <View style={styles.prList}>{personalRecords.slice(0, 4).map(renderPRCard)}</View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Detalhe da Medalha */}
      <Modal visible={!!selectedBadge} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedBadge(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedBadge(null)} />
          <View style={styles.modalContent}>
            <View style={[styles.modalIconCircle, { backgroundColor: selectedBadge?.unlocked ? selectedBadge?.color + '20' : COLORS.gray100 }]}>
              <MaterialCommunityIcons name={(selectedBadge?.icon as any) || 'medal-outline'} size={48} color={selectedBadge?.unlocked ? selectedBadge?.color : COLORS.gray400} />
            </View>
            {selectedBadge?.isEvent && (
              <View style={styles.eventBadgeTag}>
                <Text style={styles.eventBadgeText}>{S.modal.eventTag}</Text>
              </View>
            )}
            <Text style={styles.modalTitle}>{selectedBadge?.title}</Text>
            <View style={[styles.modalStatusBadge, selectedBadge?.unlocked ? { backgroundColor: COLORS.successLight } : { backgroundColor: COLORS.gray100 }]}>
              <Text style={[styles.modalStatusText, selectedBadge?.unlocked ? { color: COLORS.primary } : { color: COLORS.gray500 }]}>
                {selectedBadge?.unlocked ? S.modal.unlocked : S.modal.locked}
              </Text>
            </View>
            <Text style={styles.modalDesc}>{selectedBadge?.description}</Text>
            {!selectedBadge?.unlocked && (
              <View style={{ width: '100%', marginTop: SPACING.lg }}>
                <Text style={styles.progressCaption}>{S.modal.progressLabel.replace('{value}', selectedBadge?.progressLabel || '')}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${selectedBadge?.progressPercent || 0}%` as any, backgroundColor: COLORS.gray500 }]} />
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedBadge(null)}>
              <Text style={styles.modalCloseText}>{S.modal.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ver Mais Medalhas */}
      <Modal visible={isAllBadgesOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsAllBadgesOpen(false)}>
        <View style={styles.fullScreenModal}>
          <View style={[styles.fullScreenHeader, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.fullScreenTitle}>{S.sections.allBadgesTitle}</Text>
            <TouchableOpacity onPress={() => setIsAllBadgesOpen(false)} style={styles.closeRoundBtn} accessibilityLabel="Fechar" accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.subHeaderList}>{S.sections.progressBadgesTitle}</Text>
            <View style={styles.badgesGrid}>{badges.map((badge, index) => renderBadgeItem(badge, index, 3))}</View>

            {eventBadges.length > 0 && (
              <>
                <Text style={[styles.subHeaderList, { marginTop: SPACING.huge }]}>{S.sections.eventBadgesTitle}</Text>
                <View style={styles.badgesGrid}>{eventBadges.map((badge, index) => renderBadgeItem(badge, index, 3))}</View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Todos os PRs */}
      <Modal visible={isAllPRsOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsAllPRsOpen(false)}>
        <View style={styles.fullScreenModal}>
          <View style={[styles.fullScreenHeader, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.fullScreenTitle}>{S.sections.allPRsTitle}</Text>
            <TouchableOpacity onPress={() => setIsAllPRsOpen(false)} style={styles.closeRoundBtn} accessibilityLabel="Fechar" accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <View style={styles.prList}>{personalRecords.map(renderPRCard)}</View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Detalhe de PR (gráfico de evolução) */}
      <Modal visible={!!selectedPR} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedPR(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedPR(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderPR}>
              <View style={styles.prIconBoxLarge}>
                <MaterialCommunityIcons name="weight-lifter" size={32} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitlePR}>{selectedPR?.exerciseName}</Text>
                <Text style={styles.modalSubtitlePR}>{S.modal.currentRecord.replace('{value}', selectedPR?.weightLabel || '')}</Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <Text style={styles.chartLabel}>{S.modal.chartTitle}</Text>
              {prHistory.length > 0 ? (
                <LineChart data={prHistory} color={COLORS.primary} />
              ) : (
                <Text style={styles.chartEmptyText}>{S.empty.noPRsDesc}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedPR(null)}>
              <Text style={styles.modalCloseText}>{S.modal.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // HEADER
  header: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.huge - 2,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 10,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xxl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.whiteOpacity10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },

  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.whiteOpacity10, borderRadius: 16, paddingVertical: SPACING.lg },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.whiteOpacity20, flexShrink: 0 },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray400 },

  scrollContent: { padding: SPACING.xxl, paddingTop: SPACING.huge },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.secondary },
  seeAllText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  emptyBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  emptyBannerTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.secondary, marginTop: SPACING.sm, marginBottom: SPACING.xs, textAlign: 'center' },
  emptyBannerDesc: { ...TYPOGRAPHY.body, color: COLORS.gray500, textAlign: 'center' },

  // BADGES GRID
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  badgeItem: {
    aspectRatio: 0.85,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  badgeItemSpacing: { marginRight: SPACING.md },
  badgeLocked: { opacity: 0.8, backgroundColor: COLORS.background },
  badgeIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm, position: 'relative' },
  badgeTitle: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, textAlign: 'center' },
  lockIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.gray400, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background },
  miniProgressTrack: { width: '80%', height: 4, backgroundColor: COLORS.gray200, borderRadius: 2, marginTop: SPACING.sm - 2 },
  miniProgressFill: { height: '100%', backgroundColor: COLORS.gray400, borderRadius: 2 },
  eventTag: { marginTop: SPACING.xs, paddingHorizontal: SPACING.sm - 2, paddingVertical: 2, borderRadius: 4 },
  eventTagText: { fontSize: 8, fontWeight: '800' },

  // PR LIST
  prList: {},
  prCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray100, marginBottom: SPACING.md },
  prInfo: { flex: 1 },
  prExercise: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, marginBottom: 2 },
  prDate: { fontSize: 12, color: COLORS.gray400 },
  prValueContainer: { alignItems: 'flex-end' },
  prWeight: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  newPrBadge: { backgroundColor: COLORS.accent, paddingHorizontal: SPACING.sm - 2, paddingVertical: 2, borderRadius: 6, marginTop: SPACING.xs },
  newPrText: { fontSize: 8, fontWeight: '800', color: COLORS.white },

  // MODAL GERAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  modalContent: { width: '100%', backgroundColor: COLORS.white, borderRadius: 24, padding: SPACING.huge, alignItems: 'center' },
  modalIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.secondary, marginBottom: SPACING.sm, textAlign: 'center' },
  modalStatusBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm - 2, borderRadius: 12, marginBottom: SPACING.lg },
  modalStatusText: { fontSize: 12, fontWeight: '800' },
  modalDesc: { fontSize: 16, color: COLORS.gray500, textAlign: 'center', lineHeight: 22 },
  modalCloseBtn: { marginTop: SPACING.huge, paddingVertical: SPACING.md, paddingHorizontal: SPACING.huge, backgroundColor: COLORS.secondary, borderRadius: 12 },
  modalCloseText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  eventBadgeTag: { backgroundColor: COLORS.eventBg, borderWidth: 1, borderColor: COLORS.eventBorder, paddingHorizontal: SPACING.md - 2, paddingVertical: SPACING.xs, borderRadius: 12, marginBottom: SPACING.md },
  eventBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.eventText },
  progressCaption: { fontSize: 12, color: COLORS.gray500, marginBottom: SPACING.xs, textAlign: 'center' },
  progressTrack: { height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // MODAL PR CHART ESPECÍFICO
  modalHeaderPR: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: SPACING.xxl },
  prIconBoxLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.lg },
  modalTitlePR: { fontSize: 20, fontWeight: '800', color: COLORS.secondary },
  modalSubtitlePR: { fontSize: 14, color: COLORS.gray500, fontWeight: '600' },
  chartWrapper: { width: '100%', backgroundColor: COLORS.background, borderRadius: 16, padding: SPACING.lg, alignItems: 'center' },
  chartLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray400, marginBottom: SPACING.sm + 2, alignSelf: 'flex-start' },
  chartEmptyText: { fontSize: 13, color: COLORS.gray500, textAlign: 'center', paddingVertical: SPACING.xl },

  // MODAL FULL SCREEN (VER MAIS)
  fullScreenModal: { flex: 1, backgroundColor: COLORS.background },
  fullScreenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, backgroundColor: COLORS.white },
  fullScreenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.secondary },
  closeRoundBtn: { padding: SPACING.sm, backgroundColor: COLORS.gray100, borderRadius: 20 },
  subHeaderList: { fontSize: 16, fontWeight: '800', color: COLORS.gray500, marginBottom: SPACING.lg, marginTop: SPACING.sm },
});
