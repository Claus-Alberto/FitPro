import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Dimensions, 
  ScrollView, 
  StatusBar, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Design System & Components
import { ActionButton } from '../../components/ActionButton';
import HistoryCalendarModal from '../../../components/HistoryCalendarModal';
import { MacroBar } from '../../components/MacroBar';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import STRINGS from '../../constants/strings.json';

// Logic
import { useDashboard, WorkoutItem } from './hooks/useDashboard';

const { width } = Dimensions.get('window');

/**
 * @description Dashboard Screen (HomeScreen) for FitPro.
 * Follows "Premium Personal Trainer" voice and sales psychology.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const { user, timeline, nutrition } = useDashboard();

  const startWorkout = () => { 
    router.push('/workout/active'); 
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER: Reconhecimento e Recepção */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View>
          <Text style={styles.greeting}>{STRINGS.dashboard.greeting.replace('{name}', user.name)}</Text>
          <Text style={styles.date}>{STRINGS.dashboard.statusBadge.replace('{date}', '26 NOV')}</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO CARD: Visão Geral e Nutrição */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>{STRINGS.dashboard.hero.title}</Text>
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={20} color={COLORS.accent} />
              <Text style={styles.streakText}>{STRINGS.dashboard.hero.streak.replace('{days}', String(user.streak))}</Text>
            </View>
          </View>
          <View style={styles.macroContainer}>
            <View style={styles.calorieCircle}>
              <Text style={styles.calNumber}>{nutrition.caloriesRemaining}</Text>
              <Text style={styles.calLabel}>{STRINGS.dashboard.hero.calLabel}</Text>
            </View>
            <View style={styles.macroBars}>
              {nutrition.macros.map((macro, idx) => (
                <MacroBar 
                  key={idx}
                  label={macro.label} 
                  current={macro.current} 
                  total={macro.total} 
                  color={macro.color} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* SOCIAL PROOF: Gatilho de Comunidade */}
        <View style={styles.socialProofBox}>
          <View style={styles.avatarGroup}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.avatarMini, { marginLeft: i > 1 ? -10 : 0 }]}>
                 <MaterialCommunityIcons name="account" size={12} color={COLORS.white} />
              </View>
            ))}
          </View>
          <Text style={styles.socialText}>{STRINGS.dashboard.social.proofText}</Text>
        </View>

        {/* GRID DE AÇÃO: Rapidez e Facilidade */}
        <View style={styles.gridContainer}>
          <ActionButton 
            icon="dumbbell" 
            color={COLORS.white} 
            bg={COLORS.primary} 
            label={STRINGS.dashboard.actions.workout} 
            onPress={startWorkout} 
          /> 
          <ActionButton 
            icon="silverware-fork-knife" 
            color={COLORS.info} 
            bg="#E0F2FE" 
            label={STRINGS.dashboard.actions.meal} 
            onPress={() => router.push('/(tabs)/diet')} 
          />
        </View>

        <View style={styles.gridContainerSecondary}>
          <ActionButton 
            icon="water-plus" 
            color="#0EA5E9" 
            bg="#E0F2FE" 
            label={STRINGS.dashboard.actions.hydration} 
            onPress={() => {}} 
          />
          <ActionButton 
            icon="cart-outline" 
            color="#D97706" 
            bg="#FEF3C7" 
            label={STRINGS.dashboard.actions.market} 
            onPress={() => {}} 
          />
        </View>

        {/* SEÇÃO JORNADA: Recompensas e Histórico */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{STRINGS.dashboard.journey.title}</Text>
          <TouchableOpacity onPress={() => setIsHistoryModalOpen(true)}>
            <Text style={styles.seeAllText}>{STRINGS.common.actions.seeAll}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timelineWidget}>
          <View style={styles.timelineLine} />
          {timeline.map((item, index) => (
            <TimelineRow 
              key={item.id} 
              item={item} 
              isLast={index === timeline.length - 1} 
              onStart={startWorkout}
            />
          ))}
        </View>

        {/* BENTO BOX: Métricas Corporais */}
        <View style={styles.bentoContainer}>
          <TouchableOpacity activeOpacity={0.8} style={styles.wideWidget}>
            <View>
              <Text style={styles.widgetLabel}>{STRINGS.dashboard.metrics.weightLabel}</Text>
              <Text style={styles.widgetValue}>{user.weight} <Text style={styles.unit}>{STRINGS.common.units.kg}</Text></Text>
            </View>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="chart-line" size={24} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL REUTILIZÁVEL */}
      <HistoryCalendarModal 
        visible={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />
    </View>
  );
}

/**
 * @description Internal component for timeline rows to keep main component clean.
 */
const TimelineRow = ({ item, isLast, onStart }: { item: WorkoutItem, isLast: boolean, onStart: () => void }) => {
  let dotColor = COLORS.gray200; 
  let dotBorder = COLORS.gray200; 
  let icon = null; 
  let titleColor = COLORS.gray400;

  if (item.status === 'completed') { 
    dotColor = COLORS.primary; dotBorder = COLORS.primary; icon = 'check'; titleColor = COLORS.gray800; 
  } else if (item.status === 'skipped') { 
    dotColor = COLORS.error; dotBorder = COLORS.error; icon = 'close'; titleColor = COLORS.gray800; 
  } else if (item.status === 'pending') { 
    dotColor = COLORS.white; dotBorder = COLORS.primary; titleColor = COLORS.secondary; 
  }

  return (
    <View style={[styles.timelineRow, isLast && { marginBottom: 0 }]}>
      <View style={styles.dateCol}>
        <Text style={[styles.dayText, item.status === 'pending' && styles.todayText]}>{item.day}</Text>
      </View>
      <View style={styles.nodeCol}>
        <View style={[
          styles.node, 
          { backgroundColor: dotColor, borderColor: dotBorder }, 
          item.status === 'pending' && styles.nodePulse
        ]}>
          {icon && <MaterialCommunityIcons name={icon as any} size={12} color={COLORS.white} />}
        </View>
      </View>
      <View style={styles.infoCol}>
        <Text style={[styles.workoutTitle, { color: titleColor }]}>{item.title}</Text>
        {item.status === 'pending' && (
          <Text style={styles.nowLabel}>{STRINGS.dashboard.journey.nextStep}</Text>
        )}
      </View>
      {item.status === 'pending' && (
        <TouchableOpacity style={styles.playButton} onPress={onStart}>
          <MaterialCommunityIcons name="play" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.xl, 
    paddingBottom: SPACING.xl, 
    backgroundColor: COLORS.background, 
    zIndex: 10 
  },
  greeting: { 
    fontSize: TYPOGRAPHY.h2.fontSize, 
    fontWeight: TYPOGRAPHY.h2.fontWeight, 
    color: COLORS.secondary, 
    marginBottom: 2, 
    letterSpacing: TYPOGRAPHY.h2.letterSpacing 
  },
  date: { 
    fontSize: 11, 
    color: COLORS.gray500, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },
  scrollContent: { 
    paddingHorizontal: SPACING.xl, 
    paddingBottom: 0 
  },
  heroCard: { 
    backgroundColor: COLORS.secondary, 
    borderRadius: 24, 
    padding: SPACING.xl, 
    marginBottom: SPACING.lg, 
    ...SHADOWS.default 
  },
  heroHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.xl 
  },
  heroTitle: { 
    color: COLORS.white, 
    fontSize: TYPOGRAPHY.subtitle.fontSize, 
    fontWeight: TYPOGRAPHY.subtitle.fontWeight 
  },
  streakBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.warningLight, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    gap: 4, 
    borderWidth: 1, 
    borderColor: 'rgba(245, 158, 11, 0.3)' 
  },
  streakText: { 
    color: COLORS.accent, 
    fontSize: 14, 
    fontWeight: '800' 
  },
  macroContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  calorieCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 6, 
    borderColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 20 
  },
  calNumber: { 
    color: COLORS.white, 
    fontSize: 22, 
    fontWeight: '800' 
  },
  calLabel: { 
    color: COLORS.gray400, 
    fontSize: 10, 
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  macroBars: { 
    flex: 1 
  },
  socialProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  avatarGroup: {
    flexDirection: 'row',
    marginRight: 10,
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray400,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  gridContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 12, 
    marginBottom: 12 
  },
  gridContainerSecondary: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 12, 
    marginBottom: 24 
  },
  sectionHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontSize: TYPOGRAPHY.h3.fontSize, 
    fontWeight: TYPOGRAPHY.h3.fontWeight, 
    color: COLORS.secondary 
  },
  seeAllText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: COLORS.primary 
  },
  timelineWidget: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: SPACING.xl, 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: COLORS.gray100, 
    position: 'relative' 
  },
  timelineLine: { 
    position: 'absolute', 
    left: 74, 
    top: 30, 
    bottom: 30, 
    width: 2, 
    backgroundColor: COLORS.gray100, 
    zIndex: 0 
  },
  timelineRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20, 
    zIndex: 1 
  },
  dateCol: { 
    width: 45, 
    alignItems: 'flex-end', 
    marginRight: 12 
  },
  dayText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: COLORS.gray400 
  },
  todayText: { 
    color: COLORS.primary, 
    fontWeight: '800' 
  },
  nodeCol: { 
    width: 20, 
    alignItems: 'center', 
    marginRight: 12 
  },
  node: { 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.white 
  },
  nodePulse: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    borderWidth: 3,
    borderColor: COLORS.primary
  },
  infoCol: { 
    flex: 1 
  },
  workoutTitle: { 
    fontSize: 15, 
    fontWeight: '600' 
  },
  nowLabel: { 
    fontSize: 11, 
    color: COLORS.primary, 
    fontWeight: '700', 
    marginTop: 2 
  },
  playButton: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: COLORS.successLight, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  bentoContainer: { 
    gap: 12, 
    marginTop: 0 
  },
  wideWidget: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    padding: SPACING.xl, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: COLORS.gray100,
    ...SHADOWS.soft
  },
  widgetLabel: { 
    fontSize: 14, 
    color: COLORS.gray500, 
    marginBottom: 4, 
    fontWeight: '600' 
  },
  widgetValue: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: COLORS.secondary 
  },
  unit: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.gray400 
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  }
});