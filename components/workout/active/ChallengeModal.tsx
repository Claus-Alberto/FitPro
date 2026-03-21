import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface ChallengeModalProps {
    visible: boolean;
    challengeText: string;
    onClose: () => void;
    onAccept: () => void;
}

export function ChallengeModal({ visible, challengeText, onClose, onAccept }: ChallengeModalProps) {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.menuOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <View style={styles.challengeCard}>
                    <View style={styles.challengeIconCircle}>
                        <MaterialCommunityIcons name="camera-party-mode" size={40} color="#F59E0B" />
                    </View>
                    <Text style={styles.challengeTitle}>DESAFIO DO DIA</Text>
                    <Text style={styles.challengeText}>"{challengeText}"</Text>

                    <TouchableOpacity style={styles.challengeAcceptBtn} onPress={onAccept}>
                        <Text style={styles.challengeAcceptText}>ACEITAR E FOTOGRAFAR</Text>
                        <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.challengeCancelBtn} onPress={onClose}>
                        <Text style={styles.challengeCancelText}>Agora não</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    challengeCard: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
    challengeIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#F59E0B' },
    challengeTitle: { fontSize: 14, fontWeight: '800', color: '#F59E0B', letterSpacing: 2, marginBottom: 8 },
    challengeText: { fontSize: 20, fontWeight: '700', color: '#191511', textAlign: 'center', marginBottom: 32, lineHeight: 28 },
    challengeAcceptBtn: { width: '100%', backgroundColor: '#008E00', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
    challengeAcceptText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    challengeCancelBtn: { paddingVertical: 12 },
    challengeCancelText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
});
