import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface FinishWorkoutModalProps {
    visible: boolean;
    setsCompleted: number;
    onClose: () => void;
    onConfirm: () => void;
    bottomInset: number;
}

export function FinishWorkoutModal({ visible, setsCompleted, onClose, onConfirm, bottomInset }: FinishWorkoutModalProps) {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.mapBackdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.mapContent, { paddingBottom: bottomInset + 20 }]}>
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <View style={styles.finishIconCircle}>
                            <MaterialCommunityIcons name="flag-checkered" size={40} color="#008E00" />
                        </View>
                        <Text style={styles.finishTitle}>Treino Concluído?</Text>
                        <Text style={styles.finishSubtitle}>Você completou {setsCompleted} séries até agora. Deseja encerrar e ver seu resultado?</Text>
                    </View>
                    <View style={{ gap: 12 }}>
                        <TouchableOpacity style={styles.confirmFinishBtn} onPress={onConfirm}>
                            <Text style={styles.confirmFinishText}>SIM, FINALIZAR</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelFinishBtn} onPress={onClose}>
                            <Text style={styles.cancelFinishText}>Ainda não, voltar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    mapBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', width: width, height: height },
    mapContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    finishIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: '#DCFCE7',
    },
    finishTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#191511',
        marginBottom: 8,
    },
    finishSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    confirmFinishBtn: {
        backgroundColor: '#008E00',
        paddingVertical: 18,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: "#008E00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmFinishText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cancelFinishBtn: {
        paddingVertical: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    cancelFinishText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '700',
    },
});
