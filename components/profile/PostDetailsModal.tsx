import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface PostDetailsModalProps {
    visible: boolean;
    imageUrl: string | null;
    onClose: () => void;
}

export function PostDetailsModal({ visible, imageUrl, onClose }: PostDetailsModalProps) {
    if (!visible || !imageUrl) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={styles.modalContent}>
                    {/* Header Image */}
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: imageUrl }} style={styles.image} />
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={24} color="#191511" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header Info */}
                        <View style={styles.headerRow}>
                            <View>
                                <Text style={styles.postTitle}>Treino de Hipertrofia</Text>
                                <Text style={styles.postDate}>Há 2 dias • 45 min</Text>
                            </View>
                            <View style={styles.caloriesBadge}>
                                <MaterialCommunityIcons name="fire" size={16} color="#F59E0B" />
                                <Text style={styles.caloriesText}>320 kcal</Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            Foco total nos quadríceps hoje! Aumentei a carga no leg press e senti muito a diferença. #NoPainNoGain #LegDay
                        </Text>

                        {/* Engagement Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="heart-outline" size={24} color="#EF4444" />
                                <Text style={styles.statValue}>124</Text>
                            </View>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="comment-outline" size={24} color="#6B7280" />
                                <Text style={styles.statValue}>18</Text>
                            </View>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="share-variant-outline" size={24} color="#6B7280" />
                            </View>
                        </View>

                        {/* Comments Section (Mock) */}
                        <View style={styles.commentsSection}>
                            <Text style={styles.sectionTitle}>Comentários</Text>

                            <View style={styles.commentItem}>
                                <View style={styles.commentAvatar} />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUser}>@maromba_fit</Text>
                                    <Text style={styles.commentText}>Boa! Carga monstra demais! 🔥</Text>
                                </View>
                            </View>

                            <View style={styles.commentItem}>
                                <View style={styles.commentAvatar} />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUser}>@treinador_joao</Text>
                                    <Text style={styles.commentText}>A execução tá perfeita, continua assim.</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        overflow: 'hidden'
    },
    imageContainer: {
        height: 300,
        width: '100%',
        position: 'relative'
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        padding: 8,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    },
    scrollContent: {
        padding: 24
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    postTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#191511',
        marginBottom: 4
    },
    postDate: {
        fontSize: 14,
        color: '#6B7280'
    },
    caloriesBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4
    },
    caloriesText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F59E0B'
    },
    description: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
        marginBottom: 24
    },
    statsRow: {
        flexDirection: 'row',
        gap: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 24
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#191511'
    },
    commentsSection: {
        gap: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#191511',
        marginBottom: 8
    },
    commentItem: {
        flexDirection: 'row',
        gap: 12
    },
    commentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB'
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderTopLeftRadius: 4
    },
    commentUser: {
        fontSize: 14,
        fontWeight: '700',
        color: '#191511',
        marginBottom: 2
    },
    commentText: {
        fontSize: 14,
        color: '#4B5563'
    }
});
