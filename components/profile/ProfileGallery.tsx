import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Image, LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { PostDetailsModal } from './PostDetailsModal';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width } = Dimensions.get('window');

interface ProfileGalleryProps {
    photos: string[];
}

export function ProfileGallery({ photos }: ProfileGalleryProps) {
    const [isGrid, setIsGrid] = useState(true);
    const [selectedPost, setSelectedPost] = useState<string | null>(null);

    const toggleLayout = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsGrid(!isGrid);
    };

    const handlePostPress = (img: string) => {
        setSelectedPost(img);
    };

    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Atividade Recente</Text>
                <TouchableOpacity onPress={toggleLayout} style={styles.toggleBtn}>
                    <MaterialCommunityIcons
                        name={isGrid ? "view-grid" : "view-list"}
                        size={24}
                        color="#191511"
                    />
                </TouchableOpacity>
            </View>

            <View style={isGrid ? styles.galleryGrid : styles.galleryList}>
                {photos.map((img, index) => (
                    <TouchableOpacity
                        key={index}
                        style={isGrid ? styles.photoItemGrid : styles.photoItemList}
                        onPress={() => handlePostPress(img)}
                    >
                        <Image source={{ uri: img }} style={isGrid ? styles.photoImageGrid : styles.photoImageList} />
                        {!isGrid && (
                            <View style={styles.listInfo}>
                                <Text style={styles.listTitle}>Treino de Hipertrofia #{index + 1}</Text>
                                <Text style={styles.listDate}>Há {index + 2} dias • 45 min</Text>
                                <View style={styles.listStats}>
                                    <MaterialCommunityIcons name="fire" size={14} color="#F59E0B" />
                                    <Text style={styles.listStatsText}>320 kcal</Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <PostDetailsModal
                visible={!!selectedPost}
                imageUrl={selectedPost}
                onClose={() => setSelectedPost(null)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
    toggleBtn: { padding: 4 },

    // GRID STYLES
    galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: 2 },
    photoItemGrid: { width: (width - 8) / 3, height: (width - 8) / 3, backgroundColor: '#E5E7EB' },
    photoImageGrid: { width: '100%', height: '100%', resizeMode: 'cover' },

    // LIST STYLES
    galleryList: { paddingHorizontal: 20, gap: 12 },
    photoItemList: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', height: 100, borderWidth: 1, borderColor: '#F3F4F6' },
    photoImageList: { width: 100, height: '100%', resizeMode: 'cover' },
    listInfo: { flex: 1, padding: 12, justifyContent: 'center' },
    listTitle: { fontSize: 16, fontWeight: '700', color: '#191511', marginBottom: 4 },
    listDate: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
    listStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    listStatsText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
});
