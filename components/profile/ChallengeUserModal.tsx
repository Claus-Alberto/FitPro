import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ChallengeUserModalProps {
    visible: boolean;
    userName: string;
    onClose: () => void;
    onSend: (type: string, wager: string) => void;
}

export function ChallengeUserModal({ visible, userName, onClose, onSend }: ChallengeUserModalProps) {
    const [selectedType, setSelectedType] = useState<'1x1' | 'monthly' | 'arena'>('1x1');
    const [wager, setWager] = useState('0');

    const handleSend = () => {
        onSend(selectedType, wager);
        // Reset state after sending
        setTimeout(() => {
            setSelectedType('1x1');
            setWager('0');
        }, 500);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={styles.modalContent}>
                    <View style={styles.dragHandle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>DESAFIAR USUÁRIO</Text>
                        <Text style={styles.subtitle}>Escolha o formato do duelo contra {userName}</Text>
                    </View>

                    <View style={styles.typesGrid}>
                        <TouchableOpacity
                            style={[styles.typeCard, selectedType === '1x1' && styles.typeCardSelected]}
                            onPress={() => setSelectedType('1x1')}
                        >
                            <View style={[styles.iconCircle, selectedType === '1x1' && styles.iconCircleSelected]}>
                                <MaterialCommunityIcons name="sword-cross" size={24} color={selectedType === '1x1' ? '#FFF' : '#6B7280'} />
                            </View>
                            <Text style={[styles.typeTitle, selectedType === '1x1' && styles.typeTitleSelected]}>1x1 Rápido</Text>
                            <Text style={styles.typeDesc}>Quem treina mais na semana?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.typeCard, selectedType === 'monthly' && styles.typeCardSelected]}
                            onPress={() => setSelectedType('monthly')}
                        >
                            <View style={[styles.iconCircle, selectedType === 'monthly' && styles.iconCircleSelected]}>
                                <MaterialCommunityIcons name="calendar-month" size={24} color={selectedType === 'monthly' ? '#FFF' : '#6B7280'} />
                            </View>
                            <Text style={[styles.typeTitle, selectedType === 'monthly' && styles.typeTitleSelected]}>Meta Mensal</Text>
                            <Text style={styles.typeDesc}>Consistência de 30 dias</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.typeCard, selectedType === 'arena' && styles.typeCardSelected]}
                            onPress={() => setSelectedType('arena')}
                        >
                            <View style={[styles.iconCircle, selectedType === 'arena' && styles.iconCircleSelected]}>
                                <MaterialCommunityIcons name="trophy" size={24} color={selectedType === 'arena' ? '#FFF' : '#6B7280'} />
                            </View>
                            <Text style={[styles.typeTitle, selectedType === 'arena' && styles.typeTitleSelected]}>Arena (Aposta)</Text>
                            <Text style={styles.typeDesc}>Valendo Pontos/R$</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedType === 'arena' && (
                        <View style={styles.wagerSection}>
                            <Text style={styles.wagerLabel}>VALOR DA APOSTA (PONTOS)</Text>
                            <View style={styles.wagerInputRow}>
                                <TouchableOpacity onPress={() => setWager(String(Math.max(0, parseInt(wager) - 50)))} style={styles.wagerBtn}>
                                    <MaterialCommunityIcons name="minus" size={20} color="#191511" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.wagerInput}
                                    value={wager}
                                    onChangeText={setWager}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity onPress={() => setWager(String(parseInt(wager) + 50))} style={styles.wagerBtn}>
                                    <MaterialCommunityIcons name="plus" size={20} color="#191511" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <Text style={styles.sendBtnText}>ENVIAR DESAFIO</Text>
                        <MaterialCommunityIcons name="send" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    dragHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    header: { marginBottom: 24, alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '800', color: '#191511', letterSpacing: 1, marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

    typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    // Adjusted width to fit 3 items nicely or keep 2 per row. Since we have 3, 2 per row is fine, the last one will be centered or left aligned.
    // '48%' works for 2 columns.
    typeCard: { width: '30%', flexGrow: 1, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    typeCardSelected: { borderColor: '#008E00', backgroundColor: '#F0FDF4' },
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    iconCircleSelected: { backgroundColor: '#008E00' },
    typeTitle: { fontSize: 12, fontWeight: '800', color: '#6B7280', marginBottom: 4, textAlign: 'center' },
    typeTitleSelected: { color: '#008E00' },
    typeDesc: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 14 },

    wagerSection: { marginBottom: 24, alignItems: 'center' },
    wagerLabel: { fontSize: 12, fontWeight: '700', color: '#191511', marginBottom: 12 },
    wagerInputRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    wagerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    wagerInput: { fontSize: 24, fontWeight: '800', color: '#191511', minWidth: 80, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: '#E5E7EB' },

    sendBtn: { backgroundColor: '#008E00', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: "#008E00", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
