import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheetModal from '../../../components/BottomSheetModal';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import STRINGS from '../../../constants/strings.json';
import { MetricKey } from '../services/BodyMetricsService';
import { MetricConfig } from '../hooks/useStats';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Lista de métricas selecionáveis por chip (ex: as 5 medidas, ou as 5 métricas de bioimpedância). */
  options: MetricConfig[];
  /** Chave pré-selecionada ao abrir (ex: a medida em que o usuário tocou "Ver Histórico"). */
  initialKey?: MetricKey;
  onSave: (key: MetricKey, value: number) => Promise<void>;
}

/**
 * @description Bottom sheet genérico de "Nova Medição", reutilizado tanto pela aba Corpo (peso/
 * bioimpedância) quanto pela aba Medidas (circunferências) da tela de Estatísticas — parametrizado
 * pela lista de métricas em vez de ter uma cópia fixa por aba (Extreme Componentization).
 */
export default function NewMeasurementModal({ visible, onClose, options, initialKey, onSave }: Props) {
  const [selectedKey, setSelectedKey] = useState<MetricKey | null>(initialKey ?? options[0]?.key ?? null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedKey(initialKey ?? options[0]?.key ?? null);
      setValue('');
    }
  }, [visible, initialKey, options]);

  const selected = options.find((o) => o.key === selectedKey);

  const handleSave = async () => {
    if (!selectedKey || !value || saving) return;
    const numeric = parseFloat(value.replace(',', '.'));
    if (isNaN(numeric)) return;
    setSaving(true);
    try {
      await onSave(selectedKey, numeric);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.stats.modals.newMeasurement.title} avoidKeyboard>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setSelectedKey(opt.key)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>{STRINGS.stats.modals.newMeasurement.valueLabel}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            placeholder="0.0"
            placeholderTextColor={COLORS.gray200}
            autoFocus
          />
          <Text style={styles.unit}>{selected?.unit}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, (!value || saving) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!value || saving}
      >
        <Text style={styles.saveBtnText}>{STRINGS.stats.modals.newMeasurement.save}</Text>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    paddingBottom: SPACING.md,
    marginBottom: SPACING.xl,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  inputWrap: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    marginBottom: SPACING.lg,
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.secondary,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gray100,
    minWidth: 100,
    textAlign: 'center',
  },
  unit: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray400,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    width: '100%',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
});
