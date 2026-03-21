import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SmartEditModalProps {
    visible: boolean;
    field: 'weight' | 'reps';
    currentValue: string;
    onClose: () => void;
    onSave: (value: string) => void;
    onChangeText: (text: string) => void;
    onAdjust: (delta: number) => void;
}

export function SmartEditModal({ visible, field, currentValue, onClose, onSave, onChangeText, onAdjust }: SmartEditModalProps) {
    if (!visible) return null;

    return (
        <Modal visible={visible} transparent={true} animationType="fade" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.smartEditBackdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.smartEditContainer}>
                    <Text style={styles.smartEditTitle}>{field === 'weight' ? 'AJUSTAR CARGA' : 'AJUSTAR REPETIÇÕES'}</Text>

                    <View style={styles.smartDisplay}>
                        <TextInput
                            style={styles.smartDisplayInput}
                            value={currentValue}
                            onChangeText={onChangeText}
                            keyboardType="numeric"
                            maxLength={5}
                            selectTextOnFocus
                            autoFocus={false}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.smartDisplayUnit}>{field === 'weight' ? 'kg' : 'reps'}</Text>
                            <MaterialCommunityIcons name="pencil" size={14} color="#9CA3AF" style={{ marginLeft: 4, marginBottom: 4 }} />
                        </View>
                    </View>

                    <View style={styles.smartControlsRow}>
                        {field === 'weight' && (
                            <>
                                <TouchableOpacity style={styles.smartBtn} onPress={() => onAdjust(-5)}><Text style={styles.smartBtnText}>-5</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.smartBtn} onPress={() => onAdjust(-2.5)}><Text style={styles.smartBtnText}>-2.5</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.smartBtn} onPress={() => onAdjust(+2.5)}><Text style={styles.smartBtnText}>+2.5</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.smartBtn} onPress={() => onAdjust(+5)}><Text style={styles.smartBtnText}>+5</Text></TouchableOpacity>
                            </>
                        )}
                        {field === 'reps' && (
                            <>
                                <TouchableOpacity style={styles.smartBtn} onPress={() => onAdjust(-5)}><Text style={styles.smartBtnText}>-5</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.smartBtn} onPress={() => onAdjust(-1)}><Text style={styles.smartBtnText}>-1</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.smartBtn} onPress={() => onAdjust(+1)}><Text style={styles.smartBtnText}>+1</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.smartBtn} onPress={() => onAdjust(+5)}><Text style={styles.smartBtnText}>+5</Text></TouchableOpacity>
                            </>
                        )}
                    </View>

                    <View style={styles.smartFooter}>
                        <TouchableOpacity style={styles.smartSaveBtn} onPress={() => onSave(currentValue || "0")}>
                            <Text style={styles.smartSaveText}>CONFIRMAR</Text>
                            <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    smartEditBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', width: width, height: height },
    smartEditContainer: { width: width * 0.85, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
    smartEditTitle: { fontSize: 14, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 20 },
    smartDisplay: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24 },
    smartDisplayInput: { fontSize: 48, fontWeight: '900', color: '#191511', lineHeight: 54, minWidth: 60, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: '#F3F4F6' },
    smartDisplayUnit: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginLeft: 4 },
    smartControlsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    smartBtn: { backgroundColor: '#F3F4F6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, minWidth: 50, alignItems: 'center' },
    smartBtnText: { fontSize: 16, fontWeight: '700', color: '#191511' },
    smartFooter: { width: '100%', flexDirection: 'row', gap: 12 },
    smartSaveBtn: { flex: 1, backgroundColor: '#008E00', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    smartSaveText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
