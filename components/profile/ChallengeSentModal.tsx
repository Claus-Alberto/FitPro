import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface ChallengeSentModalProps {
    visible: boolean;
    userName: string;
    challengeType: string;
    onClose: () => void;
}

export function ChallengeSentModal({ visible, userName, challengeType, onClose }: ChallengeSentModalProps) {
    if (!visible) return null;

    return (
        <Modal visible={visible} transparent={true} animationType="fade" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

                <View style={styles.modalCard}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="check-decagram" size={64} color="#008E00" />
                    </View>

                    <Text style={styles.title}>DESAFIO ENVIADO!</Text>

                    <Text style={styles.message}>
                        Você desafiou <Text style={styles.highlight}>{userName}</Text> para um duelo <Text style={styles.highlight}>{challengeType}</Text>.
                    </Text>

                    <Text style={styles.subMessage}>
                        Assim que o desafio for aceito, você será notificado para começar a batalha.
                    </Text>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>ENTENDIDO</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalCard: {
        width: width * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    iconContainer: {
        marginBottom: 24,
        shadowColor: "#008E00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#191511',
        marginBottom: 16,
        letterSpacing: 1
    },
    message: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 24
    },
    subMessage: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 18
    },
    highlight: {
        fontWeight: '700',
        color: '#191511'
    },
    closeBtn: {
        width: '100%',
        backgroundColor: '#191511',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    closeBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1
    }
});
