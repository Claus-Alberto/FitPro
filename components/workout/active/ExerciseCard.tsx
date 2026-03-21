import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExerciseCardProps {
    exercise: any;
    index: number;
    totalExercises: number;
    inputData: any;
    inputErrors: any;
    proofImage: string | null;
    onOpenProof: () => void;
    onOpenChallenge: () => void;
    onOpenHistory: () => void;
    onOpenInfo: () => void;
    onOpenSmartEditor: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
    onToggleSet: (setIndex: number) => void;
    onAddSet: () => void;
}

export function ExerciseCard({
    exercise,
    index,
    totalExercises,
    inputData,
    inputErrors,
    proofImage,
    onOpenProof,
    onOpenChallenge,
    onOpenHistory,
    onOpenInfo,
    onOpenSmartEditor,
    onToggleSet,
    onAddSet
}: ExerciseCardProps) {
    return (
        <View style={styles.mainCardContent}>
            <View style={styles.exerciseHeader}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.exerciseIndex}>Exercício {index + 1}/{totalExercises}</Text>
                    <View style={styles.exerciseActions}>
                        {proofImage ? (
                            <TouchableOpacity style={styles.proofThumbnailBtn} onPress={onOpenProof}>
                                <Image source={{ uri: proofImage }} style={styles.proofThumbnailImg} />
                                <View style={styles.proofCheckBadge}><MaterialCommunityIcons name="check" size={8} color="#FFF" /></View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.actionIcon} onPress={onOpenChallenge}>
                                <MaterialCommunityIcons name="camera-plus-outline" size={20} color="#008E00" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.actionIcon} onPress={onOpenHistory}><MaterialCommunityIcons name="history" size={20} color="#008E00" /></TouchableOpacity>
                        <TouchableOpacity style={styles.actionIcon} onPress={onOpenInfo}><MaterialCommunityIcons name="information-outline" size={20} color="#008E00" /></TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.exerciseTitle}>{exercise.name}</Text>
            </View>

            <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, { width: 40 }]}>SET</Text>
                <Text style={[styles.colHeader, { flex: 1 }]}>ANTERIOR</Text>
                <Text style={[styles.colHeader, { width: 80 }]}>KG</Text>
                <Text style={[styles.colHeader, { width: 80 }]}>REPS</Text>
                <Text style={[styles.colHeader, { width: 40, textAlign: 'center' }]}>OK</Text>
            </View>

            {exercise.sets.map((set: any, idx: number) => {
                const key = `${index}-${idx}`;
                const isCompleted = inputData[key]?.completed;
                const hasError = inputErrors[key];
                const weightVal = inputData[key]?.weight;
                const repsVal = inputData[key]?.reps;

                return (
                    <View key={idx} style={[styles.setRow, isCompleted && styles.setRowCompleted]}>
                        <View style={styles.setNumberBox}><Text style={styles.setNumber}>{idx + 1}</Text></View>
                        <View style={{ flex: 1 }}><Text style={styles.ghostText}>{set.prev_weight}kg x {set.prev_reps}</Text></View>

                        <TouchableOpacity
                            style={[styles.inputButton, isCompleted && styles.inputDisabled, hasError && !weightVal && styles.inputError]}
                            disabled={isCompleted}
                            onPress={() => onOpenSmartEditor(idx, 'weight', set.prev_weight)}
                        >
                            <Text style={[styles.inputText, !weightVal && { color: hasError ? '#EF4444' : '#D1D5DB' }, isCompleted && { color: '#008E00' }]}>{weightVal || set.prev_weight.toString()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.inputButton, isCompleted && styles.inputDisabled, hasError && !repsVal && styles.inputError]}
                            disabled={isCompleted}
                            onPress={() => onOpenSmartEditor(idx, 'reps', set.target_reps)}
                        >
                            <Text style={[styles.inputText, !repsVal && { color: hasError ? '#EF4444' : '#D1D5DB' }, isCompleted && { color: '#008E00' }]}>{repsVal || set.target_reps.toString()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.checkbox, isCompleted && styles.checkboxChecked, hasError && styles.checkboxError]}
                            onPress={() => onToggleSet(idx)}
                        >
                            {isCompleted ? <MaterialCommunityIcons name="check" size={20} color="#FFF" /> : hasError ? <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" /> : null}
                        </TouchableOpacity>
                    </View>
                );
            })}

            <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
                <MaterialCommunityIcons name="plus" size={20} color="#008E00" />
                <Text style={styles.addSetText}>Adicionar Série</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    mainCardContent: { backgroundColor: '#FAFAFA', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingBottom: 200, flex: 1 },
    exerciseHeader: { paddingHorizontal: 20, marginBottom: 24 },
    exerciseIndex: { fontSize: 12, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },
    exerciseTitle: { fontSize: 24, fontWeight: '800', color: '#191511', marginTop: 4 },
    exerciseActions: { flexDirection: 'row', gap: 12 },
    actionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    proofThumbnailBtn: { width: 36, height: 36, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: '#008E00' },
    proofThumbnailImg: { width: '100%', height: '100%' },
    proofCheckBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#008E00', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    tableHeader: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
    colHeader: { fontSize: 12, color: '#9CA3AF', fontWeight: '800', textAlign: 'center' },
    setRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 12, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
    setRowCompleted: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
    setNumberBox: { width: 30, alignItems: 'center' },
    setNumber: { fontSize: 16, fontWeight: '700', color: '#9CA3AF' },
    ghostText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    inputButton: { width: 80, height: 44, backgroundColor: '#F9FAFB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    inputText: { fontSize: 18, fontWeight: '700', color: '#191511' },
    inputDisabled: { backgroundColor: 'transparent' },
    inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    checkbox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    checkboxChecked: { backgroundColor: '#008E00' },
    checkboxError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 },
    addSetText: { color: '#008E00', fontWeight: '700', fontSize: 14 },
});
