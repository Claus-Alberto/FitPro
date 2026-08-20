import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING } from '../../../constants/theme';
import BottomSheetModal from '../../../components/BottomSheetModal';
import { Meal, MealItem } from '../services/DietService';

const STRINGS = ALL_STRINGS.diet;

interface Props {
  visible: boolean;
  onClose: () => void;
  meal: Meal | null;
  onEditItem: (item: MealItem) => void;
  onRemoveItem: (itemId: string) => void;
  onAddFood: () => void;
  onClearItems: () => void;
  onDeleteMeal: () => void;
}

/**
 * @description Detalhe de uma refeição: lista os itens já lançados (com editar/remover),
 * atalho para adicionar mais um alimento, e as ações de limpar/excluir a refeição.
 */
export default function MealDetailModal({ visible, onClose, meal, onEditItem, onRemoveItem, onAddFood, onClearItems, onDeleteMeal }: Props) {
  const totalKcal = meal ? Math.round(meal.items.reduce((acc, i) => acc + i.kcal, 0)) : 0;

  function handleRemoveItem(itemId: string) {
    Alert.alert(ALL_STRINGS.diet.alerts.removeItemTitle, ALL_STRINGS.diet.alerts.removeItemMsg, [
      { text: ALL_STRINGS.diet.alerts.cancel, style: 'cancel' },
      { text: ALL_STRINGS.diet.alerts.delete, style: 'destructive', onPress: () => onRemoveItem(itemId) },
    ]);
  }

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={meal?.title || ''}
      headerRight={<Text style={styles.subtitle}>{meal?.time} • {totalKcal} kcal</Text>}
    >
      <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
        {meal?.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{item.food_name}</Text>
              <Text style={styles.itemMeta}>{Math.round(item.quantity)}g • {Math.round(item.kcal)} kcal</Text>
            </View>
            <TouchableOpacity onPress={() => onEditItem(item)} style={styles.actionBtn}>
              <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={[styles.actionBtn, styles.removeBtn]}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
        {(!meal || meal.items.length === 0) && <Text style={styles.emptyText}>{STRINGS.meals.emptyList}</Text>}
      </ScrollView>

      <TouchableOpacity style={styles.addFoodBtn} onPress={onAddFood}>
        <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
        <Text style={styles.addFoodText}>{STRINGS.modals.foodSearch.titleAdd}</Text>
      </TouchableOpacity>

      <View style={styles.footerRow}>
        <TouchableOpacity style={[styles.footerBtn, styles.clearBtn]} onPress={onClearItems}>
          <Text style={[styles.footerBtnText, { color: COLORS.accent }]}>{STRINGS.meals.clearItems}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, styles.deleteBtn]} onPress={onDeleteMeal}>
          <Text style={[styles.footerBtnText, { color: COLORS.error }]}>{STRINGS.meals.deleteMeal}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: COLORS.gray500, fontWeight: '600', marginRight: SPACING.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  itemName: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  itemMeta: { fontSize: 13, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  actionBtn: { padding: SPACING.sm, borderRadius: 10, backgroundColor: COLORS.successLight, marginLeft: SPACING.sm },
  removeBtn: { backgroundColor: COLORS.error + '1A' },
  emptyText: { textAlign: 'center', color: COLORS.gray400, fontStyle: 'italic', marginVertical: SPACING.xl },
  addFoodBtn: { flexDirection: 'row', backgroundColor: COLORS.secondary, paddingVertical: SPACING.lg, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  addFoodText: { color: COLORS.white, fontWeight: '800', fontSize: 16, marginLeft: SPACING.sm },
  footerRow: { flexDirection: 'row', marginTop: SPACING.md },
  footerBtn: { flex: 1, paddingVertical: SPACING.lg, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { backgroundColor: COLORS.accent + '1A', marginRight: SPACING.md },
  deleteBtn: { backgroundColor: COLORS.error + '1A' },
  footerBtnText: { fontWeight: '700', fontSize: 16 },
});
