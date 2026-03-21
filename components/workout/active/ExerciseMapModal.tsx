import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ExerciseMapModalProps {
    visible: boolean;
    exercises: any[];
    currentExerciseIndex: number;
    onClose: () => void;
    onSelectExercise: (index: number) => void;
    checkExerciseCompletion: (index: number) => boolean;
    bottomInset: number;
}

export function ExerciseMapModal({ visible, exercises, currentExerciseIndex, onClose, onSelectExercise, checkExerciseCompletion, bottomInset }: ExerciseMapModalProps) {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.mapBackdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.mapContent, { paddingBottom: bottomInset + 20 }]}>
                    <View style={styles.mapHeader}>
                        <Text style={styles.mapTitle}>Ordem dos Exercícios</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeIconBg}>
                            <MaterialCommunityIcons name="close" size={24} color="#191511" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {exercises.map((exercise, index) => {
                            const isCurrent = index === currentExerciseIndex;
                            const isDone = checkExerciseCompletion(index);
                            return (
                                <TouchableOpacity key={index} style={[styles.mapItem, isCurrent && styles.mapItemActive]} onPress={() => onSelectExercise(index)}>
                                    <View style={[styles.mapItemIcon, isDone ? styles.mapItemIconDone : isCurrent ? styles.mapItemIconActive : styles.mapItemIconPending]}>
                                        {isDone ? <MaterialCommunityIcons name="check" size={16} color="#FFF" /> : <Text style={[styles.mapIndexText, isCurrent && { color: '#FFF' }]}>{index + 1}</Text>}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.mapItemTitle, isCurrent && { color: '#008E00' }, isDone && { color: '#9CA3AF', textDecorationLine: 'line-through' }]}>{exercise.name}</Text>
                                        <Text style={styles.mapItemSets}>{exercise.sets.length} séries</Text>
                                    </View>
                                    {isCurrent && <View style={styles.doingBadge}><Text style={styles.doingText}>FAZENDO AGORA</Text></View>}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    mapBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', width: width, height: height },
    mapContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    mapTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },
    closeIconBg: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
    mapItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    mapItemActive: { borderColor: '#008E00', backgroundColor: '#F0FDF4' },
    mapItemIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    mapItemIconPending: { backgroundColor: '#F3F4F6' },
    mapItemIconActive: { backgroundColor: '#008E00' },
    mapItemIconDone: { backgroundColor: '#008E00' },
    mapIndexText: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    mapItemTitle: { fontSize: 16, fontWeight: '700', color: '#191511' },
    mapItemSets: { fontSize: 12, color: '#6B7280' },
    doingBadge: { backgroundColor: '#008E00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    doingText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
});
