import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheetModal from '../../../components/BottomSheetModal';
import LineChart from '../../../components/LineChart';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import STRINGS from '../../../constants/strings.json';
import { MetricPoint } from '../services/BodyMetricsService';
import { formatShortDatePt } from '../utils';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  unit: string;
  color: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  currentValue: number | null;
  history: MetricPoint[];
}

/**
 * @description Bottom sheet genérico de "detalhe de métrica" (valor atual + histórico em
 * `LineChart`) — reutilizado pelos 4 `BioCard`s da aba Corpo e por qualquer medida da aba Medidas,
 * em vez de um modal fixo por métrica.
 */
export default function MetricDetailModal({ visible, onClose, title, unit, color, icon, currentValue, history }: Props) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={title}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
          <MaterialCommunityIcons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.currentValue}>
          {currentValue != null ? `${currentValue} ${unit}` : '—'}
        </Text>
      </View>

      <Text style={styles.chartLabel}>{STRINGS.stats.modals.detail.historyLabel}</Text>
      {history.length > 0 ? (
        <LineChart
          data={history.map((h) => ({ date: formatShortDatePt(h.date), value: h.value }))}
          color={color}
          unit={unit}
        />
      ) : (
        <Text style={styles.emptyText}>{STRINGS.stats.modals.detail.empty}</Text>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  currentValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.secondary,
  },
  chartLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray400,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    textAlign: 'center',
    paddingVertical: SPACING.xxl,
  },
});
