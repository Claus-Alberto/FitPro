import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

// --- MOCK INITIAL DATA ---
const INITIAL_DATA = {
  name: 'Claus',
  username: '@claus.fit',
  bio: 'Ectomorfo em busca do shape inexplicável. 🚀 Foco total na hipertrofia e na dieta flexível.',
  weight: '82.5',
  height: '1.78',
  age: '26',
  gender: 'M',
  goal: 'hypertrophy',
  level: 'intermediate',
  photo: "https://github.com/shadcn.png",
  cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" // Nova imagem de capa
};

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ESTADO DE CONTROLE DE MODO (View vs Edit)
  const [isEditing, setIsEditing] = useState(false);

  // ESTADOS DO FORMULÁRIO
  const [photo, setPhoto] = useState(INITIAL_DATA.photo);
  const [cover, setCover] = useState(INITIAL_DATA.cover); // Novo estado para capa
  const [name, setName] = useState(INITIAL_DATA.name);
  const [bio, setBio] = useState(INITIAL_DATA.bio);

  const [weight, setWeight] = useState(INITIAL_DATA.weight);
  const [heightValue, setHeightValue] = useState(INITIAL_DATA.height);
  const [age, setAge] = useState(INITIAL_DATA.age);

  const [goal, setGoal] = useState(INITIAL_DATA.goal);
  const [level, setLevel] = useState(INITIAL_DATA.level);

  // --- AÇÕES ---

  const handleHeaderRightAction = () => {
    if (isEditing) {
      // Salvar
      setIsEditing(false);
      Alert.alert("Atualizado", "Seu perfil foi salvo com sucesso!");
      // Aqui chamaria a API
    } else {
      // Entrar no modo edição
      setIsEditing(true);
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

  // Função para trocar a capa (Mockada por enquanto, mas funcional na lógica)
  const handleChangeCover = async () => {
    if (!isEditing) return;
    Alert.alert("Trocar Capa", "Funcionalidade para escolher foto de capa aqui.");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER FLUTUANTE (ABSOLUTE) */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Título removido para dar destaque à capa */}

        <TouchableOpacity onPress={handleHeaderRightAction} style={styles.actionBtn}>
          {isEditing ? (
            <Text style={styles.saveHeaderBtn}>Concluir</Text>
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

          {/* 1. ÁREA DE CAPA E AVATAR (NOVO LAYOUT) */}
          <View style={styles.profileHeaderContainer}>
            {/* Imagem de Capa */}
            <View style={styles.coverContainer}>
              <Image source={{ uri: cover }} style={styles.coverImage} />
              <View style={styles.coverOverlay} />

              {isEditing && (
                <TouchableOpacity style={styles.editCoverBtn} onPress={handleChangeCover}>
                  <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
                  <Text style={styles.editCoverText}>Editar Capa</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Avatar Sobreposto */}
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: photo }} style={styles.avatarImage} />
              {isEditing && (
                <TouchableOpacity style={styles.cameraBadge} onPress={handleChangePhoto}>
                  <MaterialCommunityIcons name="camera" size={18} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Dados de Identidade (Nome, User, Bio) */}
            <View style={styles.identitySection}>
              {isEditing ? (
                <View style={styles.editIdentityForm}>
                  <Text style={styles.inputLabel}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Seu nome"
                  />
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Sua frase..."
                    multiline
                  />
                </View>
              ) : (
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <Text style={styles.readOnlyName}>{name}</Text>
                  <Text style={styles.readOnlyHandle}>{INITIAL_DATA.username}</Text>
                  <Text style={styles.readOnlyBio}>{bio}</Text>

                  {/* Tags de Resumo no Modo Leitura */}
                  <View style={styles.tagsRow}>
                    <View style={styles.miniTag}>
                      <MaterialCommunityIcons name="trophy-variant" size={12} color="#F59E0B" />
                      <Text style={styles.miniTagText}>Nível {level === 'intermediate' ? 'Intermed.' : 'Iniciante'}</Text>
                    </View>
                    <View style={styles.miniTag}>
                      <MaterialCommunityIcons name="target" size={12} color="#3B82F6" />
                      <Text style={styles.miniTagText}>{goal === 'hypertrophy' ? 'Hipertrofia' : 'Emagrecimento'}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 3. BIO-DADOS (GRID 3 COLUNAS) */}
          <Text style={styles.sectionTitle}>Suas Medidas</Text>
          <View style={styles.statsRow}>
            {/* Peso */}
            <View style={[styles.statInputContainer, !isEditing && styles.statContainerReadOnly]}>
              <Text style={styles.statLabel}>PESO (KG)</Text>
              {isEditing ? (
                <TextInput
                  style={styles.statInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  maxLength={5}
                />
              ) : (
                <Text style={styles.statValueReadOnly}>{weight}</Text>
              )}
            </View>

            {/* Altura */}
            <View style={[styles.statInputContainer, !isEditing && styles.statContainerReadOnly]}>
              <Text style={styles.statLabel}>ALTURA (M)</Text>
              {isEditing ? (
                <TextInput
                  style={styles.statInput}
                  value={heightValue}
                  onChangeText={setHeightValue}
                  keyboardType="numeric"
                  maxLength={4}
                />
              ) : (
                <Text style={styles.statValueReadOnly}>{heightValue}</Text>
              )}
            </View>

            {/* Idade */}
            <View style={[styles.statInputContainer, !isEditing && styles.statContainerReadOnly]}>
              <Text style={styles.statLabel}>IDADE</Text>
              {isEditing ? (
                <TextInput
                  style={styles.statInput}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={2}
                />
              ) : (
                <Text style={styles.statValueReadOnly}>{age}</Text>
              )}
            </View>
          </View>

          {/* 4. OBJETIVO (Só mostra opções completas se estiver editando ou como lista visual) */}
          <Text style={styles.sectionTitle}>Objetivo & Nível</Text>

          {/* No modo leitura, já mostramos nas tags lá em cima, mas aqui deixamos os controles para edição */}
          <View style={[styles.pillsContainer, !isEditing && { opacity: 0.6 }]}>
            <OptionPill label="Hipertrofia" icon="arm-flex" selected={goal === 'hypertrophy'} onPress={() => isEditing && setGoal('hypertrophy')} disabled={!isEditing} />
            <OptionPill label="Emagrecimento" icon="fire" selected={goal === 'weight_loss'} onPress={() => isEditing && setGoal('weight_loss')} disabled={!isEditing} />
            <OptionPill label="Força Pura" icon="weight-lifter" selected={goal === 'strength'} onPress={() => isEditing && setGoal('strength')} disabled={!isEditing} />
          </View>

          <View style={[styles.levelContainer, !isEditing && { opacity: 0.6 }]}>
            <LevelOption label="Iniciante" sub="0-1 ano" selected={level === 'beginner'} onPress={() => isEditing && setLevel('beginner')} disabled={!isEditing} />
            <LevelOption label="Intermed." sub="1-3 anos" selected={level === 'intermediate'} onPress={() => isEditing && setLevel('intermediate')} disabled={!isEditing} />
            <LevelOption label="Avançado" sub="3+ anos" selected={level === 'advanced'} onPress={() => isEditing && setLevel('advanced')} disabled={!isEditing} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
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
      {/* CORREÇÃO: Usando a prop {icon} em vez da string fixa "icon" */}
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', display: 'none' }, // Oculto para não brigar com a capa
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

  // --- NOVA ESTRUTURA DE HEADER ---
  profileHeaderContainer: { alignItems: 'center', marginBottom: 24, backgroundColor: '#FFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  coverContainer: { width: '100%', height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  editCoverBtn: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  editCoverText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  avatarWrapper: { marginTop: -50, marginBottom: 12, position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFFFFF' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#008E00', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },

  identitySection: { width: '100%', paddingHorizontal: 24, alignItems: 'center' },
  editIdentityForm: { width: '100%' },

  readOnlyName: { fontSize: 24, fontWeight: '800', color: '#191511', marginBottom: 2, textAlign: 'center' },
  readOnlyHandle: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 12 },
  readOnlyBio: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  miniTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  miniTagText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },

  // Inputs
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', alignSelf: 'flex-start' },
  input: { width: '100%', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: '600', color: '#191511', marginBottom: 20 },

  // Stats
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191511', marginBottom: 16, paddingHorizontal: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32, paddingHorizontal: 24 },
  statInputContainer: { flex: 1 },
  statContainerReadOnly: { alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 6, textAlign: 'center' },
  statInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingVertical: 16, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#191511' },
  statValueReadOnly: { fontSize: 20, fontWeight: '800', color: '#191511' },

  // Pills (Objetivo)
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32, paddingHorizontal: 24 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 30, paddingVertical: 12, paddingHorizontal: 20 },
  pillSelected: { backgroundColor: '#191511', borderColor: '#191511' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  pillTextSelected: { color: '#FFFFFF' },

  // Level Options
  levelContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
  levelCard: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', position: 'relative' },
  levelCardSelected: { borderColor: '#008E00', backgroundColor: '#F0FDF4' },
  levelLabel: { fontSize: 13, fontWeight: '700', color: '#191511', marginBottom: 4 },
  levelLabelSelected: { color: '#008E00' },
  levelSub: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  levelSubSelected: { color: '#008E00' },
  checkCircle: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#008E00', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' }
});