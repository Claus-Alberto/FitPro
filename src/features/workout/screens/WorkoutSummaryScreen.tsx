import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from "react-native-view-shot";

const { width, height } = Dimensions.get('window');

// IMPORT DO LOGO OFICIAL
const LOGO_IMAGE = require('../../../../assets/images/logotipobg.png');

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ workoutName?: string; duration?: string; totalVolume?: string; prs?: string }>();

  // Resumo real do treino que acabou de ser salvo (vem via params de ActiveWorkoutScreen).
  // `calories` e `xpEarned` ainda não têm uma fonte de dados real (dependem de um cálculo
  // metabólico/motor de XP que não existe ainda), então continuam estimados por enquanto.
  const SUMMARY_DATA = {
    workoutName: params.workoutName || 'Treino',
    duration: params.duration || '0:00',
    totalVolume: params.totalVolume || '0.0 kg',
    calories: '—',
    prs: params.prs ? parseInt(params.prs, 10) : 0,
    xpEarned: '+50 XP',
  };

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);

  // ESTADOS DE LOADING
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // <--- NOVO

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const menuScaleAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    if (isPhotoMenuOpen) {
      Animated.spring(menuScaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
    } else {
      menuScaleAnim.setValue(0);
    }
  }, [isPhotoMenuOpen]);

  const handleImageResult = (result: ImagePicker.ImagePickerResult) => {
    setIsPhotoMenuOpen(false);
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    handleImageResult(result);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    handleImageResult(result);
  };

  const handleSelectPhotoSource = () => {
    setIsPhotoMenuOpen(true);
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    setTimeout(async () => {
      try {
        const uri = await viewShotRef.current?.capture();
        if (uri) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Compartilhar Treino FitPro',
            UTI: 'image/png'
          });
        }
      } catch (error) {
        console.error("Erro ao compartilhar", error);
        Alert.alert("Erro", "Não foi possível gerar a imagem.");
      } finally {
        setIsSharing(false);
      }
    }, 100);
  };

  // --- SALVAR E SAIR ---
  // O treino já foi persistido de verdade no SQLite em ActiveWorkoutScreen.confirmFinish()
  // antes de chegar nesta tela; aqui só mantemos a transição/loading visual de saída.
  const handleFinish = () => {
    if (isSaving) return; // Evita duplo clique

    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);

      // Limpa a navegação para não deixar voltar para o resumo
      router.dismissAll();

      // Redireciona para a aba de Treinos (Agenda)
      // Onde ele verá o check verde no dia de hoje
      router.replace('/(tabs)/workout');
      router.dismissAll();
    }, 1500); // 1.5 segundos de "Saving..."
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#191511" hidden={isPhotoMenuOpen} />
      <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} fallSpeed={3000} />

      {/* --- O TEMPLATE DE SHARE ESCONDIDO --- */}
      <View style={{ position: 'absolute', left: -2000, top: 0, opacity: 0 }}>
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.95 }}>
          <View style={styles.shareTemplateContainer}>
            <Image
              source={{ uri: photoUri || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }}
              style={styles.shareTemplateImage}
            />
            <View style={styles.shareOverlay} />
            <View style={styles.shareContent}>
              <View style={styles.shareLogoContainer}>
                <Image source={LOGO_IMAGE} style={styles.shareLogoImage} />
              </View>
              <View style={{ flex: 1 }} />
              <View style={styles.shareFooter}>
                <Text style={styles.shareTitle}>TREINO CONCLUÍDO</Text>
                <Text style={styles.shareSubtitle}>{SUMMARY_DATA.workoutName}</Text>
                <View style={styles.shareStatsRow}>
                  <View style={styles.shareStat}>
                    <Text style={styles.shareStatValue}>{SUMMARY_DATA.duration}</Text>
                    <Text style={styles.shareStatLabel}>TEMPO</Text>
                  </View>
                  <View style={styles.shareStatSeparator} />
                  <View style={styles.shareStat}>
                    <Text style={styles.shareStatValue}>{SUMMARY_DATA.totalVolume}</Text>
                    <Text style={styles.shareStatLabel}>VOLUME</Text>
                  </View>
                  <View style={styles.shareStatSeparator} />
                  <View style={styles.shareStat}>
                    <Text style={styles.shareStatValue}>{SUMMARY_DATA.prs}</Text>
                    <Text style={styles.shareStatLabel}>RECORDES</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ViewShot>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={[styles.header, { paddingTop: insets.top + 40 }]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="trophy" size={40} color="#F59E0B" />
          </View>
          <Text style={styles.title}>TREINO CONCLUÍDO!</Text>
          <Text style={styles.subtitle}>{SUMMARY_DATA.workoutName}</Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>{SUMMARY_DATA.xpEarned}</Text>
          </View>
        </View>

        <Animated.View style={[styles.contentCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={24} color="#6B7280" />
              <Text style={styles.statValue}>{SUMMARY_DATA.duration}</Text>
              <Text style={styles.statLabel}>Duração</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="weight-lifter" size={24} color="#008E00" />
              <Text style={styles.statValue}>{SUMMARY_DATA.totalVolume}</Text>
              <Text style={styles.statLabel}>Volume Total</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={24} color="#EF4444" />
              <Text style={styles.statValue}>{SUMMARY_DATA.calories}</Text>
              <Text style={styles.statLabel}>Calorias</Text>
            </View>
            <View style={[styles.statItem, styles.statItemHighlight]}>
              <MaterialCommunityIcons name="star" size={24} color="#F59E0B" />
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{SUMMARY_DATA.prs}</Text>
              <Text style={[styles.statLabel, { color: '#D97706' }]}>Recordes</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Registro do Shape (Pump Check)</Text>
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <TouchableOpacity style={styles.retakeBtn} onPress={handleSelectPhotoSource}>
                <MaterialCommunityIcons name="camera-retake" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoPlaceholder} onPress={handleSelectPhotoSource}>
              <View style={styles.cameraIconCircle}>
                <MaterialCommunityIcons name="camera-plus" size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.photoPlaceholderText}>Adicionar foto do treino</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={isSharing}>
          {isSharing ? <ActivityIndicator color="#191511" /> : <MaterialCommunityIcons name="share-variant" size={24} color="#191511" />}
        </TouchableOpacity>

        {/* BOTÃO SALVAR AGORA COM LOADING */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.8 }]}
          onPress={handleFinish}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.saveBtnText}>SALVAR E SAIR</Text>
              <MaterialCommunityIcons name="check" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={isPhotoMenuOpen} transparent={true} animationType="fade" onRequestClose={() => setIsPhotoMenuOpen(false)}>
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsPhotoMenuOpen(false)} />
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Escolha uma opção</Text>
            <View style={styles.menuButtonsRow}>
              <Animated.View style={{ transform: [{ scale: menuScaleAnim }] }}>
                <TouchableOpacity style={styles.menuBtn} onPress={pickFromGallery}>
                  <View style={[styles.menuBtnCircle, { backgroundColor: '#E0F2FE' }]}>
                    <MaterialCommunityIcons name="image-multiple" size={32} color="#0EA5E9" />
                  </View>
                  <Text style={styles.menuBtnText}>Galeria</Text>
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: menuScaleAnim }] }}>
                <TouchableOpacity style={styles.menuBtn} onPress={takePhoto}>
                  <View style={[styles.menuBtnCircle, { backgroundColor: '#F0FDF4' }]}>
                    <MaterialCommunityIcons name="camera" size={32} color="#008E00" />
                  </View>
                  <Text style={styles.menuBtnText}>Câmera</Text>
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: menuScaleAnim }] }}>
                <TouchableOpacity style={styles.menuBtn} onPress={() => setIsPhotoMenuOpen(false)}>
                  <View style={[styles.menuBtnCircle, { backgroundColor: '#FEF2F2' }]}>
                    <MaterialCommunityIcons name="close" size={32} color="#EF4444" />
                  </View>
                  <Text style={styles.menuBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#191511' },
  header: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#F59E0B' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#9CA3AF', marginBottom: 16, textAlign: 'center' },
  xpBadge: { backgroundColor: '#008E00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  xpText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  contentCard: { flex: 1, backgroundColor: '#FAFAFA', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 120 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statItem: { width: (width - 48 - 16) / 2, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statItemHighlight: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#191511', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#191511', marginBottom: 16 },
  photoPlaceholder: { width: '100%', height: 200, borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', gap: 12 },
  cameraIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  photoContainer: { width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  retakeBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16, paddingHorizontal: 24, flexDirection: 'row', gap: 12 },
  shareBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 16 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#008E00', borderRadius: 16, gap: 8, height: 56 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  menuContent: { width: '100%', alignItems: 'center' },
  menuTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 32, opacity: 0.9 },
  menuButtonsRow: { flexDirection: 'row', gap: 32, justifyContent: 'center', alignItems: 'flex-start' },
  menuBtn: { alignItems: 'center', gap: 12 },
  menuBtnCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  menuBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  shareTemplateContainer: { width: 375, height: 667, backgroundColor: '#191511', position: 'relative' },
  shareTemplateImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  shareOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  shareContent: { ...StyleSheet.absoluteFillObject, zIndex: 10, padding: 32, justifyContent: 'space-between' },
  shareLogoContainer: { marginTop: 20, alignItems: 'flex-start' },
  shareLogoImage: { width: 150, height: 50, resizeMode: 'contain' },
  shareFooter: { marginBottom: 40 },
  shareTitle: { color: '#008E00', fontSize: 16, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  shareSubtitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginBottom: 24, lineHeight: 36 },
  shareStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.15)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  shareStat: { alignItems: 'center' },
  shareStatValue: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  shareStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  shareStatSeparator: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
});