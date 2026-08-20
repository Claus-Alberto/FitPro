import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import STRINGS from '../../src/constants/strings.json';
import { ProfileGoal, ProfileLevel, ProfileService } from '../../src/features/profile/services/ProfileService';
import { BodyMetricsService } from '../../src/features/stats/services/BodyMetricsService';

const S = STRINGS.profile.screen;

/**
 * @description Tela de edição do perfil real do usuário (não confundir com `app/profile/view.tsx`,
 * o perfil PÚBLICO/social). Nome/bio/altura/idade/objetivo/nível/fotos persistem via
 * `ProfileService` (chave/valor em `UserPreferences`); peso persiste via `BodyMetricsService`
 * (`weight_kg`), fonte única de verdade de peso corporal usada também pela Home/Estatísticas.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  const [weight, setWeight] = useState('');
  const [heightValue, setHeightValue] = useState('');
  const [age, setAge] = useState('');

  const [goal, setGoal] = useState<ProfileGoal | null>(null);
  const [level, setLevel] = useState<ProfileLevel | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const [profile, latestWeight] = await Promise.all([
        ProfileService.getProfile(),
        BodyMetricsService.getLatest('weight_kg'),
      ]);
      setPhoto(profile.photoUri);
      setCover(profile.coverUri);
      setName(profile.name);
      setBio(profile.bio);
      setHeightValue(profile.heightM !== null ? String(profile.heightM) : '');
      setAge(profile.age !== null ? String(profile.age) : '');
      setGoal(profile.goal);
      setLevel(profile.level);
      setWeight(latestWeight ? String(latestWeight.value) : '');
    } catch (error) {
      console.warn('[EditProfileScreen] Erro ao carregar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dados podem ter mudado em outra tela (ex: peso registrado pelo card da Home) — recarrega
  // sempre que a tela volta ao foco, não só na primeira montagem.
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleHeaderRightAction = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    try {
      const parsedHeight = parseFloat(heightValue.replace(',', '.'));
      const parsedAge = parseInt(age, 10);
      const parsedWeight = parseFloat(weight.replace(',', '.'));

      await ProfileService.updateProfile({
        name,
        bio,
        heightM: Number.isFinite(parsedHeight) ? parsedHeight : null,
        age: Number.isFinite(parsedAge) ? parsedAge : null,
        goal,
        level,
        photoUri: photo,
        coverUri: cover,
      });

      if (Number.isFinite(parsedWeight) && parsedWeight > 0) {
        await BodyMetricsService.logMetric('weight_kg', parsedWeight);
      }

      setIsEditing(false);
      Alert.alert(S.saveSuccessTitle, S.saveSuccessMsg);
    } catch (error) {
      console.warn('[EditProfileScreen] Erro ao salvar perfil:', error);
      // Mantém `isEditing` true de propósito: se o salvamento falhou de verdade, o usuário
      // precisa continuar na tela de edição pra tentar de novo, sem perder o que digitou.
      Alert.alert(S.saveErrorTitle, S.saveErrorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    if (!isEditing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleChangeCover = async () => {
    if (!isEditing) return;

    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      const request = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!request.granted) {
        Alert.alert(S.coverPermissionTitle, S.coverPermissionMsg);
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCover(result.assets[0].uri);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#008E00" />
        <Text style={styles.loadingText}>{S.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER FLUTUANTE (ABSOLUTE) */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleHeaderRightAction} style={styles.actionBtn} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : isEditing ? (
            <Text style={styles.saveHeaderBtn}>{S.doneCta}</Text>
          ) : (
            <View style={styles.editIconBlur}>
              <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

          {/* 1. ÁREA DE CAPA E AVATAR */}
          <View style={styles.profileHeaderContainer}>
            {/* Imagem de Capa */}
            <View style={styles.coverContainer}>
              {cover ? (
                <Image source={{ uri: cover }} style={styles.coverImage} />
              ) : (
                <View style={[styles.coverImage, styles.coverPlaceholder]}>
                  <MaterialCommunityIcons name="image-outline" size={40} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.coverOverlay} />

              {isEditing && (
                <TouchableOpacity style={styles.editCoverBtn} onPress={handleChangeCover}>
                  <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
                  <Text style={styles.editCoverText}>{S.editCoverCta}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Avatar Sobreposto */}
            <View style={styles.avatarWrapper}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <MaterialCommunityIcons name="account" size={48} color="#9CA3AF" />
                </View>
              )}
              {isEditing && (
                <TouchableOpacity style={styles.cameraBadge} onPress={handleChangePhoto}>
                  <MaterialCommunityIcons name="camera" size={18} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Dados de Identidade (Nome, Bio) */}
            <View style={styles.identitySection}>
              {isEditing ? (
                <View style={styles.editIdentityForm}>
                  <Text style={styles.inputLabel}>{S.nameLabel}</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={S.namePlaceholder}
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.inputLabel}>{S.bioLabel}</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder={S.bioPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                </View>
              ) : (
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <Text style={styles.readOnlyName}>{name || S.namePlaceholder}</Text>
                  <Text style={styles.readOnlyBio}>{bio || S.bioEmpty}</Text>

                  {/* Tags de Resumo no Modo Leitura */}
                  {(goal || level) && (
                    <View style={styles.tagsRow}>
                      {level && (
                        <View style={styles.miniTag}>
                          <MaterialCommunityIcons name="trophy-variant" size={12} color="#F59E0B" />
                          <Text style={styles.miniTagText}>{levelLabel(level)}</Text>
                        </View>
                      )}
                      {goal && (
                        <View style={styles.miniTag}>
                          <MaterialCommunityIcons name="target" size={12} color="#3B82F6" />
                          <Text style={styles.miniTagText}>{goalLabel(goal)}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* 3. BIO-DADOS (GRID 3 COLUNAS) */}
          <Text style={styles.sectionTitle}>{S.measuresTitle}</Text>
          <View style={styles.statsRow}>
            {/* Peso */}
            <View style={[styles.statInputContainer, !isEditing && styles.statContainerReadOnly]}>
              <Text style={styles.statLabel}>{S.weightFieldLabel}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.statInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  maxLength={5}
                />
              ) : (
                <Text style={styles.statValueReadOnly}>{weight || S.notSet}</Text>
              )}
            </View>

            {/* Altura */}
            <View style={[styles.statInputContainer, !isEditing && styles.statContainerReadOnly]}>
              <Text style={styles.statLabel}>{S.heightFieldLabel}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.statInput}
                  value={heightValue}
                  onChangeText={setHeightValue}
                  keyboardType="numeric"
                  maxLength={4}
                />
              ) : (
                <Text style={styles.statValueReadOnly}>{heightValue || S.notSet}</Text>
              )}
            </View>

            {/* Idade */}
            <View style={[styles.statInputContainer, !isEditing && styles.statContainerReadOnly]}>
              <Text style={styles.statLabel}>{S.ageFieldLabel}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.statInput}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={2}
                />
              ) : (
                <Text style={styles.statValueReadOnly}>{age || S.notSet}</Text>
              )}
            </View>
          </View>

          {/* 4. OBJETIVO */}
          <Text style={styles.sectionTitle}>{S.goalLevelTitle}</Text>

          <View style={[styles.pillsContainer, !isEditing && { opacity: 0.6 }]}>
            <OptionPill label={S.goalHypertrophy} icon="arm-flex" selected={goal === 'hypertrophy'} onPress={() => isEditing && setGoal('hypertrophy')} disabled={!isEditing} />
            <OptionPill label={S.goalWeightLoss} icon="fire" selected={goal === 'weight_loss'} onPress={() => isEditing && setGoal('weight_loss')} disabled={!isEditing} />
            <OptionPill label={S.goalStrength} icon="weight-lifter" selected={goal === 'strength'} onPress={() => isEditing && setGoal('strength')} disabled={!isEditing} />
          </View>

          <View style={[styles.levelContainer, !isEditing && { opacity: 0.6 }]}>
            <LevelOption label={S.levelBeginner} sub="0-1 ano" selected={level === 'beginner'} onPress={() => isEditing && setLevel('beginner')} disabled={!isEditing} />
            <LevelOption label={S.levelIntermediate} sub="1-3 anos" selected={level === 'intermediate'} onPress={() => isEditing && setLevel('intermediate')} disabled={!isEditing} />
            <LevelOption label={S.levelAdvanced} sub="3+ anos" selected={level === 'advanced'} onPress={() => isEditing && setLevel('advanced')} disabled={!isEditing} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- HELPERS ---

function goalLabel(goal: ProfileGoal): string {
  if (goal === 'hypertrophy') return STRINGS.profile.screen.goalHypertrophy;
  if (goal === 'weight_loss') return STRINGS.profile.screen.goalWeightLoss;
  return STRINGS.profile.screen.goalStrength;
}

function levelLabel(level: ProfileLevel): string {
  if (level === 'beginner') return STRINGS.profile.screen.levelBeginner;
  if (level === 'advanced') return STRINGS.profile.screen.levelAdvanced;
  return STRINGS.profile.screen.levelIntermediate;
}

// --- SUB-COMPONENTES ---

const OptionPill = ({ label, icon, selected, onPress, disabled }: any) => {
  const containerStyle = [
    styles.pill,
    selected && styles.pillSelected,
    disabled && !selected && { display: 'none' } // Oculta não selecionados no modo leitura para limpar a tela
  ];

  if (disabled && !selected) return null;

  return (
    <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.8} disabled={disabled}>
      <MaterialCommunityIcons name={icon} size={20} color={selected ? "#FFF" : "#6B7280"} />
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const LevelOption = ({ label, sub, selected, onPress, disabled }: any) => {
  const containerStyle = [
    styles.levelCard,
    selected && styles.levelCardSelected,
    disabled && !selected && { display: 'none' }
  ];

  if (disabled && !selected) return null;

  return (
    <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.8} disabled={disabled}>
      <Text style={[styles.levelLabel, selected && styles.levelLabelSelected]}>{label}</Text>
      <Text style={[styles.levelSub, selected && styles.levelSubSelected]}>{sub}</Text>
      {selected && <View style={styles.checkCircle}><MaterialCommunityIcons name="check" size={12} color="#FFF" /></View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#6B7280' },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center'
  },
  actionBtn: {},
  saveHeaderBtn: {
    fontSize: 14, fontWeight: '700', color: '#191511',
    backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12
  },
  editIconBlur: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center'
  },

  scrollContent: { paddingBottom: 20 },

  // --- ESTRUTURA DE HEADER ---
  profileHeaderContainer: { alignItems: 'center', marginBottom: 24, backgroundColor: '#FFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  coverContainer: { width: '100%', height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { backgroundColor: '#E5E7EB' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  editCoverBtn: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  editCoverText: { color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 6 },

  avatarWrapper: { marginTop: -50, marginBottom: 12, position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFFFFF' },
  avatarPlaceholder: { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#008E00', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },

  identitySection: { width: '100%', paddingHorizontal: 24, alignItems: 'center' },
  editIdentityForm: { width: '100%' },

  readOnlyName: { fontSize: 24, fontWeight: '800', color: '#191511', marginBottom: 2, textAlign: 'center' },
  readOnlyBio: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  miniTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  miniTagText: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginLeft: 4 },

  // Inputs
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', alignSelf: 'flex-start' },
  input: { width: '100%', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: '600', color: '#191511', marginBottom: 20 },

  // Stats
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511', marginBottom: 16, paddingHorizontal: 24 },
  statsRow: { flexDirection: 'row', marginBottom: 32, paddingHorizontal: 24 },
  statInputContainer: { flex: 1, marginRight: 12 },
  statContainerReadOnly: { alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 6, textAlign: 'center' },
  statInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingVertical: 16, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#191511' },
  statValueReadOnly: { fontSize: 20, fontWeight: '800', color: '#191511' },

  // Pills (Objetivo)
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 32, paddingHorizontal: 24 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 30, paddingVertical: 12, paddingHorizontal: 20, marginRight: 10, marginBottom: 10 },
  pillSelected: { backgroundColor: '#191511', borderColor: '#191511' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 8 },
  pillTextSelected: { color: '#FFFFFF' },

  // Level Options
  levelContainer: { flexDirection: 'row', paddingHorizontal: 24 },
  levelCard: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', position: 'relative', marginRight: 12 },
  levelCardSelected: { borderColor: '#008E00', backgroundColor: '#F0FDF4' },
  levelLabel: { fontSize: 13, fontWeight: '700', color: '#191511', marginBottom: 4 },
  levelLabelSelected: { color: '#008E00' },
  levelSub: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  levelSubSelected: { color: '#008E00' },
  checkCircle: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#008E00', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' }
});
