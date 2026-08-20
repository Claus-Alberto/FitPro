import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import BottomSheetModal from '../../../components/BottomSheetModal';
import { DietService, FoodEntry } from '../services/DietService';

const STRINGS = ALL_STRINGS.diet;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** @description Chamado com o alimento recém-criado, já persistido em `Foods` (source='custom'). */
  onCreated: (food: FoodEntry) => void;
}

/**
 * @description Cadastro de alimento customizado — macros sempre por 100g (mesmo padrão do
 * catálogo TACO/Open Food Facts), gravado via `DietService.createCustomFood` e disponível nas
 * buscas futuras automaticamente.
 */
export default function CustomFoodModal({ visible, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) { setName(''); setKcal(''); setProt(''); setCarb(''); setFat(''); setIsSaving(false); }
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(ALL_STRINGS.diet.alerts.error, STRINGS.modals.customFood.errorName);
      return;
    }
    const kcalValue = parseFloat(kcal.replace(',', '.')) || 0;
    if (kcalValue <= 0) {
      Alert.alert(ALL_STRINGS.diet.alerts.error, STRINGS.modals.customFood.errorKcal);
      return;
    }
    setIsSaving(true);
    try {
      const food = await DietService.createCustomFood({
        name: name.trim(),
        kcal_100g: kcalValue,
        protein_100g: parseFloat(prot.replace(',', '.')) || 0,
        carb_100g: parseFloat(carb.replace(',', '.')) || 0,
        fat_100g: parseFloat(fat.replace(',', '.')) || 0,
      });
      onCreated(food);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.modals.customFood.title} avoidKeyboard maxHeight="90%">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>{STRINGS.modals.customFood.nameLabel}</Text>
        <TextInput style={styles.input} placeholder={STRINGS.modals.customFood.namePlaceholder} placeholderTextColor={COLORS.gray400} value={name} onChangeText={setName} />

        <Text style={styles.label}>{STRINGS.modals.customFood.kcalLabel}</Text>
        <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.gray400} keyboardType="numeric" value={kcal} onChangeText={setKcal} />

        <View style={styles.row}>
          <View style={[styles.rowItem, { marginRight: SPACING.md }]}>
            <Text style={styles.label}>{STRINGS.modals.customFood.protLabel}</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.gray400} keyboardType="numeric" value={prot} onChangeText={setProt} />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>{STRINGS.modals.customFood.carbLabel}</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.gray400} keyboardType="numeric" value={carb} onChangeText={setCarb} />
          </View>
        </View>
        <Text style={styles.label}>{STRINGS.modals.customFood.fatLabel}</Text>
        <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.gray400} keyboardType="numeric" value={fat} onChangeText={setFat} />

        <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>{STRINGS.modals.customFood.save}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  label: { ...TYPOGRAPHY.tiny, color: COLORS.gray500, marginBottom: SPACING.sm },
  input: { backgroundColor: COLORS.gray100, borderRadius: 12, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2, fontSize: 16, fontWeight: '600', color: COLORS.secondary, marginBottom: SPACING.xl },
  row: { flexDirection: 'row' },
  rowItem: { flex: 1 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.xs },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
