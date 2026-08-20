import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import STRINGS from '../../../src/constants/strings.json';

const S = STRINGS.workout.exerciseInfo;

const { width, height } = Dimensions.get('window');

interface ExerciseInfoModalProps {
    visible: boolean;
    exerciseName: string;
    instructions: any;
    onClose: () => void;
    bottomInset: number;
}

/**
 * @description Alterna (crossfade) entre as duas fotos de início/fim do movimento pra dar uma
 * sensação de animação sem precisar de um GIF de verdade — as imagens do `free-exercise-db` são
 * só 2 fotos estáticas por exercício (ver `ExerciseMediaService`).
 */
const ExerciseMediaFrames = ({ images }: { images: string[] }) => {
    const [frameIndex, setFrameIndex] = useState(0);
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (images.length < 2) return;
        const interval = setInterval(() => {
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                setFrameIndex((i) => (i + 1) % images.length);
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            });
        }, 1400);
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <Animated.Image source={{ uri: images[frameIndex] }} style={[styles.infoImage, { opacity }]} resizeMode="cover" />
    );
};

export function ExerciseInfoModal({ visible, exerciseName, instructions, onClose, bottomInset }: ExerciseInfoModalProps) {
    const images: string[] = instructions.images || [];
    return (
        <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
            <View style={styles.mapBackdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.mapContent, { padding: 0, paddingBottom: bottomInset + 20 }]}>
                    <View style={styles.infoHeaderImageContainer}>
                        {/* Mídia do catálogo original (exercises-dataset) é © Gym Visual, licença
                            separada do MIT do texto — não usamos ela. Quando há correspondência no
                            free-exercise-db (domínio público), mostramos as 2 fotos reais do
                            movimento alternando; senão, um placeholder em vez de inventar mídia. */}
                        {images.length > 0 ? (
                            <>
                                <ExerciseMediaFrames images={images} />
                                <View style={styles.infoAttribution}>
                                    <Text style={styles.infoAttributionText}>{S.photoAttribution}</Text>
                                </View>
                            </>
                        ) : (
                            <View style={[styles.infoImage, styles.infoImagePlaceholder]}>
                                <MaterialCommunityIcons name="dumbbell" size={40} color="#D1D5DB" />
                                <Text style={styles.infoImagePlaceholderText}>{S.noMediaAvailable}</Text>
                            </View>
                        )}
                        <View style={styles.infoHeaderOverlay}>
                            <TouchableOpacity onPress={onClose} style={styles.infoCloseBtn}>
                                <MaterialCommunityIcons name="close" size={24} color="#191511" />
                            </TouchableOpacity>
                        </View>
                        {!!instructions.difficulty && (
                            <View style={styles.infoBadgeDifficulty}>
                                <Text style={styles.infoBadgeText}>{instructions.difficulty}</Text>
                            </View>
                        )}
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                        <Text style={styles.infoTitle}>{exerciseName}</Text>
                        <View style={styles.tagsContainer}>
                            <View style={[styles.tag, styles.tagPrimary]}>
                                <Text style={[styles.tagText, styles.tagTextPrimary]}>{instructions.primaryMuscle}</Text>
                            </View>
                            {(instructions.secondaryMuscles || []).map((m: string, i: number) => (
                                <View key={i} style={styles.tag}><Text style={styles.tagText}>{m}</Text></View>
                            ))}
                        </View>
                        {!!instructions.steps?.length && (
                            <>
                                <Text style={styles.infoSectionTitle}>Como Fazer</Text>
                                <View style={styles.stepsContainer}>
                                    {instructions.steps.map((step: string, index: number) => (
                                        <View key={index} style={styles.stepRow}>
                                            <View style={styles.stepCircle}><Text style={styles.stepNumber}>{index + 1}</Text></View>
                                            <Text style={styles.stepText}>{step}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                        {!!instructions.mistake && (
                            <View style={styles.warningBox}>
                                <View style={styles.warningHeader}>
                                    <MaterialCommunityIcons name="alert-outline" size={20} color="#C2410C" style={styles.warningIcon} />
                                    <Text style={styles.warningTitle}>Erro Comum</Text>
                                </View>
                                <Text style={styles.warningText}>{instructions.mistake}</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    mapBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', width: width, height: height },
    mapContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    infoHeaderImageContainer: { height: 250, width: '100%', position: 'relative', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    infoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    infoImagePlaceholder: { backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
    infoImagePlaceholderText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 8 },
    infoAttribution: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 4, paddingHorizontal: 12 },
    infoAttributionText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
    infoHeaderOverlay: { position: 'absolute', top: 24, right: 24, zIndex: 10 },
    infoCloseBtn: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    infoBadgeDifficulty: { position: 'absolute', bottom: 24, left: 24, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    infoBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    infoTitle: { fontSize: 24, fontWeight: '800', color: '#191511', marginBottom: 16 },
    // `gap` evitado de propósito (bug documentado) — espaçamento via marginRight/marginBottom
    // explícitos nos filhos (`tag`, `stepRow`, `warningIcon`) em vez do próprio container.
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8, marginBottom: 8 },
    tagPrimary: { backgroundColor: '#191511' },
    tagText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    tagTextPrimary: { color: '#FFFFFF' },
    infoSectionTitle: { fontSize: 16, fontWeight: '800', color: '#191511', marginBottom: 12 },
    stepsContainer: { marginBottom: 24 },
    stepRow: { flexDirection: 'row', marginBottom: 16 },
    stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginTop: 2, marginRight: 12 },
    stepNumber: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
    stepText: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },
    warningBox: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 12, padding: 16 },
    warningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    warningIcon: { marginRight: 8 },
    warningTitle: { fontSize: 14, fontWeight: '700', color: '#C2410C' },
    warningText: { fontSize: 13, color: '#9A3412', lineHeight: 18 },
});
