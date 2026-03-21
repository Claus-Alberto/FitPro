import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ProofModalProps {
    visible: boolean;
    imageUri: string | null;
    onClose: () => void;
    onDelete: () => void;
}

export function ProofModal({ visible, imageUri, onClose, onDelete }: ProofModalProps) {
    return (
        <Modal visible={visible} transparent={true} animationType="fade" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.proofModalOverlay}>
                <TouchableOpacity style={styles.proofModalCloseBtn} onPress={onClose}>
                    <MaterialCommunityIcons name="close" size={28} color="#FFF" />
                </TouchableOpacity>

                {imageUri && (
                    <Image source={{ uri: imageUri }} style={styles.proofFullImage} resizeMode="contain" />
                )}

                <View style={styles.proofModalFooter}>
                    <TouchableOpacity style={styles.proofDeleteBtn} onPress={onDelete}>
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#EF4444" />
                        <Text style={styles.proofDeleteText}>Apagar Prova</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    proofModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    proofModalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
    proofFullImage: { width: width, height: height * 0.7, backgroundColor: '#000' },
    proofModalFooter: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
    proofDeleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, gap: 8 },
    proofDeleteText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
});
