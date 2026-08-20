import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ALL_STRINGS from '../../../constants/strings.json';
import { COLORS, SPACING } from '../../../constants/theme';
import BottomSheetModal from '../../../components/BottomSheetModal';

const STRINGS = ALL_STRINGS.diet;

interface Props {
  visible: boolean;
  onClose: () => void;
  onPhotoPress: () => void;
  onCustomFoodPress: () => void;
  onRecipePress: () => void;
}

/**
 * @description Menu de criação (foto do prato / alimento customizado / receita), aberto a partir
 * do botão "+" da busca de alimentos.
 */
export default function CreationMenuModal({ visible, onClose, onPhotoPress, onCustomFoodPress, onRecipePress }: Props) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={STRINGS.modals.creation.title}>
      <TouchableOpacity style={styles.option} onPress={onPhotoPress}>
        <View style={[styles.icon, { backgroundColor: COLORS.info + '1A' }]}>
          <MaterialCommunityIcons name="camera-iris" size={24} color={COLORS.info} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{STRINGS.modals.creation.photoTitle}</Text>
          <Text style={styles.optionSub}>{STRINGS.modals.creation.photoSub}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={onCustomFoodPress}>
        <View style={[styles.icon, { backgroundColor: COLORS.successLight }]}>
          <MaterialCommunityIcons name="food-apple" size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{STRINGS.modals.creation.foodTitle}</Text>
          <Text style={styles.optionSub}>{STRINGS.modals.creation.foodSub}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.option, { marginBottom: 0 }]} onPress={onRecipePress}>
        <View style={[styles.icon, { backgroundColor: COLORS.accent + '1A' }]}>
          <MaterialCommunityIcons name="chef-hat" size={24} color={COLORS.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{STRINGS.modals.creation.recipeTitle}</Text>
          <Text style={styles.optionSub}>{STRINGS.modals.creation.recipeSub}</Text>
        </View>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderRadius: 16, backgroundColor: COLORS.background, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.gray100 },
  icon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.lg },
  optionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  optionSub: { fontSize: 12, color: COLORS.gray400 },
});
