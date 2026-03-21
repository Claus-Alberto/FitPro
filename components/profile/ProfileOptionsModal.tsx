import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ProfileOptionsModalProps {
    visible: boolean;
    userName: string;
    onClose: () => void;
    onReport: () => void;
    onBlock: () => void;
}

export function ProfileOptionsModal({ visible, userName, onClose, onReport, onBlock }: ProfileOptionsModalProps) {
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Opções</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeIconBg}>
                            <MaterialCommunityIcons name="close" size={24} color="#191511" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalSubtitle}>Ações para {userName}</Text>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.actionBtn} onPress={onReport}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EF4444" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: '#EF4444' }]}>Denunciar Usuário</Text>
                                <Text style={styles.actionDesc}>Sinalizar comportamento inadequado</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={onBlock}>
                            <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                                <MaterialCommunityIcons name="block-helper" size={24} color="#374151" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>Bloquear</Text>
                                <Text style={styles.actionDesc}>Você não verá mais conteúdo deste usuário</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },
    closeIconBg: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
    modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },

    actionsContainer: { gap: 12, marginBottom: 24 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 16
    },
    iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    actionTextContainer: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: '700', color: '#191511', marginBottom: 2 },
    actionDesc: { fontSize: 12, color: '#6B7280' },

    cancelBtn: { paddingVertical: 16, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16 },
    cancelBtnText: { fontSize: 16, fontWeight: '700', color: '#374151' },
});
