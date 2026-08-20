import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import BottomSheetModal from '../../../components/BottomSheetModal';
import { FoodEntry } from '../services/DietService';

const STRINGS = ALL_STRINGS.diet;

export interface RecipeIngredient {
  food: FoodEntry;
  quantityGrams: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  ingredients: RecipeIngredient[];
  onAddIngredientPress: () => void;
  onRemoveIngredient: (index: number) => void;
  onSave: (name: string, servings: number) => void | Promise<void>;
}

/**
 * @description Monta uma receita a partir de ingredientes (cada um com seu peso em gramas) —
 * o cálculo de macros por porção é só uma prévia local; quem persiste de fato é
 * `DietService.createRecipe` (média ponderada dos ingredientes, vira um `Foods` normal).
 * A lista de ingredientes é preenchida via `FoodSearchModal` + `QuantityModal`, reaberto por
 * cima deste modal — por isso os ingredientes vêm de fora como prop, não como estado local.
 */
export default function RecipeBuilderModal({ visible, onClose, ingredients, onAddIngredientPress, onRemoveIngredient, onSave }: Props) {
  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) { setName(''); setServings('1'); setIsSaving(false); }
  }, [visible]);

  const totals = useMemo(() => {
    const sum = ingredients.reduce((acc, ing) => ({
      kcal: acc.kcal + (ing.food.kcal_100g * ing.quantityGrams) / 100,
      p: acc.p + (ing.food.protein_100g * ing.quantityGrams) / 100,
      c: acc.c + (ing.food.carb_100g * ing.quantityGrams) / 100,
      f: acc.f + (ing.food.fat_100g * ing.quantityGrams) / 100,
    }), { kcal: 0, p: 0, c: 0, f: 0 });
    const portions = parseFloat(servings.replace(',', '.')) || 1;
    return {
      kcal: Math.round(sum.kcal / portions),
      p: Math.round(sum.p / portions),
      c: Math.round(sum.c / portions),
      f: Math.round(sum.f / portions),
    };
  }, [ingredients, servings]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert(ALL_STRINGS.diet.alerts.error, STRINGS.modals.recipe.errorName);
    if (ingredients.length === 0) return Alert.alert(ALL_STRINGS.diet.alerts.error, STRINGS.modals.recipe.errorIngredients);
    const portions = parseFloat(servings.replace(',', '.')) || 1;
    setIsSaving(true);
    try {
      await onSave(name.trim(), portions);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.modals.recipe.title} avoidKeyboard maxHeight="90%">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>{STRINGS.modals.recipe.perServing} ({servings || '1'} {STRINGS.modals.recipe.yield})</Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalsItem}><Text style={styles.totalsVal}>{totals.kcal}</Text><Text style={styles.totalsLab}>kcal</Text></View>
            <View style={styles.totalsItem}><Text style={styles.totalsVal}>{totals.p}g</Text><Text style={styles.totalsLab}>Prot</Text></View>
            <View style={styles.totalsItem}><Text style={styles.totalsVal}>{totals.c}g</Text><Text style={styles.totalsLab}>Carb</Text></View>
            <View style={styles.totalsItem}><Text style={styles.totalsVal}>{totals.f}g</Text><Text style={styles.totalsLab}>Gord</Text></View>
          </View>
        </View>

        <Text style={styles.label}>{STRINGS.modals.recipe.nameLabel}</Text>
        <TextInput style={styles.input} placeholder={STRINGS.modals.recipe.namePlaceholder} placeholderTextColor={COLORS.gray400} value={name} onChangeText={setName} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.label}>{STRINGS.modals.recipe.ingredientsLabel}</Text>
          <TouchableOpacity onPress={onAddIngredientPress} style={styles.addIngredientBtn}>
            <MaterialCommunityIcons name="plus" size={16} color={COLORS.primary} />
            <Text style={styles.addIngredientText}>{STRINGS.modals.recipe.addIngredient}</Text>
          </TouchableOpacity>
        </View>

        {ingredients.map((ing, idx) => (
          <View key={`${ing.food.id}_${idx}`} style={styles.ingredientRow}>
            <Text style={styles.ingredientName} numberOfLines={1}>{ing.quantityGrams}g {ing.food.name}</Text>
            <Text style={styles.ingredientKcal}>{Math.round((ing.food.kcal_100g * ing.quantityGrams) / 100)} kcal</Text>
            <TouchableOpacity onPress={() => onRemoveIngredient(idx)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
        {ingredients.length === 0 && <Text style={styles.emptyText}>{STRINGS.modals.recipe.emptyIngredients}</Text>}

        <Text style={[styles.label, { marginTop: SPACING.xl }]}>{STRINGS.modals.recipe.yieldLabel}</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={servings} onChangeText={setServings} />

        <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>{STRINGS.modals.recipe.save}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  totalsCard: { backgroundColor: COLORS.successLight, padding: SPACING.lg, borderRadius: 12, marginBottom: SPACING.xl },
  totalsTitle: { ...TYPOGRAPHY.tiny, color: COLORS.primary, marginBottom: SPACING.sm },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  totalsItem: { alignItems: 'center' },
  totalsVal: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  totalsLab: { fontSize: 10, color: COLORS.gray500 },
  label: { ...TYPOGRAPHY.tiny, color: COLORS.gray500, marginBottom: SPACING.sm },
  input: { backgroundColor: COLORS.gray100, borderRadius: 12, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2, fontSize: 16, fontWeight: '600', color: COLORS.secondary, marginBottom: SPACING.xl },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  addIngredientBtn: { flexDirection: 'row', alignItems: 'center' },
  addIngredientText: { color: COLORS.primary, fontWeight: '700', marginLeft: SPACING.xs },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  ingredientName: { flex: 1, fontWeight: '600', color: COLORS.secondary, marginRight: SPACING.sm },
  ingredientKcal: { color: COLORS.gray500, marginRight: SPACING.md },
  removeBtn: { padding: SPACING.xs },
  emptyText: { fontSize: 11, color: COLORS.gray200, fontStyle: 'italic', marginTop: SPACING.xs },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.xl },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
