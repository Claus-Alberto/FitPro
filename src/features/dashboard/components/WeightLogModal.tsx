import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheetModal from '../../../components/BottomSheetModal';
import STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING } from '../../../constants/theme';

const S = STRINGS.dashboard.metrics;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Último peso registrado (kg), usado para pré-preencher o campo. Null se nunca houve registro. */
  currentWeight: number | null;
  onSave: (kg: number) => Promise<void> | void;
}

/**
 * @description Bottom sheet simples para registrar o peso corporal do dia (card "Peso Monitorado"
 * da Home). Persistência real é feita por quem chama `onSave` (via `BodyMetricsService.logMetric`),
 * não por este componente.
 */
export default function WeightLogModal({ visible, onClose, currentWeight, onSave }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(currentWeight !== null ? String(currentWeight) : '');
      setError(false);
    }
  }, [visible, currentWeight]);

  const handleSave = async () => {
    const kg = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(kg) || kg <= 0) {
      setError(true);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(kg);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={S.weightModalTitle} avoidKeyboard>
      <Text style={styles.label}>{S.weightModalLabel}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={(t) => { setValue(t); setError(false); }}
        keyboardType="numeric"
        autoFocus
        placeholder="0.0"
        placeholderTextColor={COLORS.gray400}
      />
      {error && <Text style={styles.errorText}>{S.weightModalError}</Text>}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
        <Text style={styles.saveBtnText}>{S.weightModalSave}</Text>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray500, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  inputError: { borderWidth: 1, borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: 12, fontWeight: '600', marginBottom: SPACING.md, textAlign: 'center' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
