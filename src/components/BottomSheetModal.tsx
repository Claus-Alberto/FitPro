import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  DimensionValue,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** @default '85%' */
  maxHeight?: DimensionValue;
  /** Envolve o conteúdo em KeyboardAvoidingView — usar quando o corpo tem TextInput. */
  avoidKeyboard?: boolean;
  headerRight?: React.ReactNode;
}

/**
 * @description Shell padrão de "bottom sheet" (fundo escurecido + folha deslizando de baixo,
 * cantos superiores arredondados, header com título + botão de fechar) reproduzindo o padrão
 * visual já consolidado no app (ex: HistoryCalendarModal, FinishWorkoutModal). Centraliza esse
 * shell aqui para novos modais nascerem consistentes por código, não por convenção copiada.
 */
export default function BottomSheetModal({ visible, onClose, title, children, maxHeight = '85%', avoidKeyboard = false, headerRight }: Props) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.sheet, { maxHeight, paddingBottom: insets.bottom + SPACING.xl }]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.headerActions}>
          {headerRight}
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        {avoidKeyboard ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            {content}
          </KeyboardAvoidingView>
        ) : (
          content
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
    flex: 1,
    marginRight: SPACING.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: COLORS.gray100,
    padding: SPACING.sm,
    borderRadius: 20,
  },
});
