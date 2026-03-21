import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- DADOS MOCKADOS ---

const INITIAL_MY_GROUPS = [
  {
    id: 'create',
    name: 'Novo / Entrar',
    type: 'action',
    isAction: true
  },
  {
    id: 'g1',
    name: 'Proj. Verão',
    type: 'private',
    rank: 2,
    hasUpdate: true,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&w=200&q=80'
  },
  {
    id: 'g2',
    name: 'Arena #402',
    type: 'paid',
    rank: 5,
    hasUpdate: true,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&w=200&q=80',
    prize: 'R$ 500'
  },
  {
    id: 'g3',
    name: 'Só os Fortes',
    type: 'private',
    rank: 1,
    hasUpdate: false,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&w=200&q=80'
  },
];

const FEED_POSTS = [
  {
    id: 'p1',
    user: { name: 'Ana Julia', handle: '@anaju.fit', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=100&q=80', level: 8 },
    group: { id: 'g1', name: 'Proj. Verão', type: 'private' },
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&w=800&q=80',
    workoutTitle: 'Leg Day Insano',
    workoutStats: '4.5 Ton • 60min',
    time: '2h atrás',
    likes: 12,
    isLiked: false,
    isValidatedByMe: false,
  },
  {
    id: 'p2',
    user: { name: 'Marcos Paulo', handle: '@marcos.p', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&w=100&q=80', level: 15 },
    group: { id: 'g2', name: 'Arena #402', type: 'paid' },
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&w=800&q=80',
    workoutTitle: 'Peito & Tríceps',
    workoutStats: '8.2 Ton • 45min',
    time: '4h atrás',
    likes: 24,
    isLiked: true,
    isReported: false,
  },
];

const GROUP_RANKING = [
  { id: 1, name: 'Pedro H.', xp: 2400, avatar: 'https://github.com/shadcn.png' },
  { id: 2, name: 'Claus (Você)', xp: 2150, avatar: 'https://github.com/shadcn.png' },
  { id: 3, name: 'Ana Julia', xp: 1900, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=100&q=80' },
  { id: 4, name: 'Lucas M.', xp: 1200, avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 5, name: 'Marcos P.', xp: 1150, avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
];

const COMMENTS_DATA = [
  { id: 'c1', user: 'Lucas M.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', text: 'Monstro demais! 💪', time: '10m' },
  { id: 'c2', user: 'Ana Julia', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=100&q=80', text: 'Aí sim, quero ver bater meu PR! 😂', time: '5m' },
];

const MOCK_POST_WORKOUT_DETAILS = [
  { name: 'Agachamento Livre', sets: '4 séries', load: '100kg (Máx)' },
  { name: 'Leg Press 45', sets: '4 séries', load: '240kg' },
  { name: 'Cadeira Extensora', sets: '3 séries', load: 'Drop-set' },
  { name: 'Stiff', sets: '4 séries', load: '80kg' },
];

// --- COMPONENTE DE POST ---
const PostItem = ({ item, onLike, onValidate, onReport, onOpenOptions, onOpenGroup, onComment, onOpenWorkout }: any) => {
  const isPaidGroup = item.group?.type === 'paid';

  const lastTap = useRef<number | null>(null);
  const heartScale = useRef(new Animated.Value(0)).current;

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      animateHeart();
      if (!item.isLiked) {
        onLike(item.id);
      }
    } else {
      lastTap.current = now;
    }
  };

  const animateHeart = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.delay(500),
      Animated.timing(heartScale, { toValue: 0, duration: 150, useNativeDriver: true })
    ]).start();
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={{ uri: item.user.avatar }} style={styles.avatarSmall} />
          <View>
            <Text style={styles.userName}>{item.user.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {item.group ? (
                <TouchableOpacity onPress={() => onOpenGroup(item.group)}>
                  <Text style={styles.groupNameSmall}>{item.group.name}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.groupNameSmall}>Feed Geral</Text>
              )}
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.timeAgo}>{item.time}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => onOpenOptions(item)} style={styles.postOptionsBtn}>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.mainImage} />

          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <MaterialCommunityIcons name="heart" size={100} color="#FFF" style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }} />
            </Animated.View>
          </View>

          <TouchableOpacity style={styles.workoutInfoOverlay} activeOpacity={0.8} onPress={() => onOpenWorkout(item)}>
            <View style={styles.workoutIconBox}>
              <MaterialCommunityIcons name="dumbbell" size={16} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.workoutTitle}>{item.workoutTitle}</Text>
              <Text style={styles.workoutStats}>{item.workoutStats}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.actionRow}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => onLike(item.id)}>
            <MaterialCommunityIcons name={item.isLiked ? "heart" : "heart-outline"} size={28} color={item.isLiked ? "#EF4444" : "#191511"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment(item.id)}>
            <MaterialCommunityIcons name="comment-outline" size={26} color="#191511" />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialCommunityIcons name="share-variant-outline" size={26} color="#191511" />
          </TouchableOpacity>
        </View>

        {isPaidGroup ? (
          <TouchableOpacity style={[styles.gameActionBtn, item.isReported ? styles.btnReported : styles.btnReport]} onPress={() => onReport(item.id)} disabled={item.isReported}>
            <Text style={[styles.gameActionText, { color: item.isReported ? '#9CA3AF' : '#EF4444' }]}>{item.isReported ? 'Reportado' : 'Denunciar'}</Text>
            {!item.isReported && <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#EF4444" />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.gameActionBtn, item.isValidatedByMe ? styles.btnValidated : styles.btnValidate]} onPress={() => onValidate(item.id)}>
            <Text style={[styles.gameActionText, { color: item.isValidatedByMe ? '#008E00' : '#FFF' }]}>{item.isValidatedByMe ? 'Validado' : 'Validar'}</Text>
            <MaterialCommunityIcons name={item.isValidatedByMe ? "check" : "check-decagram"} size={18} color={item.isValidatedByMe ? "#008E00" : "#FFF"} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.likesText}>{item.likes} curtidas</Text>
    </View>
  );
};

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Estados Globais
  const [groups, setGroups] = useState(INITIAL_MY_GROUPS);
  const [posts, setPosts] = useState(FEED_POSTS);
  const [selectedGroup, setSelectedGroup] = useState<any>(null); // Controla o Modal
  const [activeTab, setActiveTab] = useState<'feed' | 'ranking'>('feed'); // Tab dentro do Modal

  // Estados Modais
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [viewingPostWorkout, setViewingPostWorkout] = useState<any>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  // Estados de Join
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [isJoinDetailsModalOpen, setIsJoinDetailsModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [previewGroup, setPreviewGroup] = useState<any>(null);

  // Estados Criação
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupType, setNewGroupType] = useState<'private' | 'paid'>('private');
  const [newGroupDuration, setNewGroupDuration] = useState('Mensal');

  const [currentPostOptions, setCurrentPostOptions] = useState<any>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // --- AÇÕES ---

  const handleCreateNewGroup = () => {
    if (!newGroupName.trim()) { Alert.alert("Erro", "O nome do grupo é obrigatório."); return; }
    const newGroup = { id: `new_${Date.now()}`, name: newGroupName, type: newGroupType, rank: null, hasUpdate: false, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&w=200&q=80', duration: newGroupDuration, members: 1, prize: newGroupType === 'paid' ? 'R$ 0' : undefined };
    const actionBtn = groups[0];
    const otherGroups = groups.slice(1);
    setGroups([actionBtn, newGroup, ...otherGroups]);
    setNewGroupName(''); setNewGroupDesc(''); setIsCreateFormOpen(false); Alert.alert("Sucesso", "Grupo criado!");
  };

  const handleOpenJoinCode = () => {
    setCreateGroupModalVisible(false);
    setTimeout(() => setIsJoinCodeModalOpen(true), 300);
  };

  const handleSearchGroup = () => {
    Keyboard.dismiss();
    if (!joinCode.trim()) { Alert.alert("Erro", "Digite o código do grupo"); return; }

    const mockFoundGroup = {
      id: `join_${Date.now()}`,
      name: 'CrossFit Elite',
      type: 'paid',
      prize: 'R$ 1.000',
      rank: null,
      hasUpdate: false,
      image: 'https://images.unsplash.com/photo-1517963879466-e9b5ce386d38?ixlib=rb-4.0.3&w=200&q=80',
      description: 'Competição de alta intensidade para atletas avançados. Quem pontuar mais leva o prêmio.',
      members: 156,
      duration: 'Mensal'
    };

    setPreviewGroup(mockFoundGroup);
    setIsJoinCodeModalOpen(false);
    setTimeout(() => setIsJoinDetailsModalOpen(true), 300);
  };

  const handleConfirmJoin = () => {
    if (!previewGroup) return;
    const actionBtn = groups[0];
    const otherGroups = groups.slice(1);
    setGroups([actionBtn, previewGroup, ...otherGroups]);
    setIsJoinDetailsModalOpen(false);
    setJoinCode('');
    setPreviewGroup(null);
    Alert.alert("Sucesso", `Você entrou em ${previewGroup.name}!`);
  };

  const handleValidate = (postId: string) => { const newPosts = posts.map(p => p.id === postId ? { ...p, isValidatedByMe: !p.isValidatedByMe } : p); setPosts(newPosts); };
  const handleLike = (postId: string) => { const newPosts = posts.map(p => { if (p.id === postId) { const isLikedNow = !p.isLiked; return { ...p, isLiked: isLikedNow, likes: isLikedNow ? p.likes + 1 : p.likes - 1 }; } return p; }); setPosts(newPosts); };
  const handleReport = (postId: string) => { Alert.alert("Denunciar", "Confirmar denúncia?", [{ text: "Cancelar", style: "cancel" }, { text: "Sim", style: "destructive", onPress: () => { const newPosts = posts.map(p => p.id === postId ? { ...p, isReported: true } : p); setPosts(newPosts); } }]); };
  const openPostOptions = (item: any) => { setCurrentPostOptions(item); setOptionsModalVisible(true); };
  const handleOpenComments = (postId: string) => { setActivePostId(postId); setCommentsModalVisible(true); };
  const handleSendComment = () => { if (!newCommentText.trim()) return; setNewCommentText(''); Alert.alert("Sucesso", "Comentário enviado!"); };

  // --- ATUALIZAÇÃO AQUI ---
  const handleOptionAction = (action: 'profile' | 'details' | 'report') => {
    setOptionsModalVisible(false);
    if (!currentPostOptions) return;

    switch (action) {
      case 'profile':
        // Navega para a tela de perfil público passando os dados
        router.push({
          pathname: '/profile/view',
          params: {
            name: currentPostOptions.user.name,
            handle: currentPostOptions.user.handle,
            avatar: currentPostOptions.user.avatar,
            level: currentPostOptions.user.level
          }
        });
        break;
      case 'details':
        setViewingPostWorkout(currentPostOptions);
        break;
      case 'report':
        setTimeout(() => handleReport(currentPostOptions.id), 300);
        break;
    }
  };

  const handleCreateOrJoin = () => { setCreateGroupModalVisible(true); };
  const handleOpenCreateForm = () => { setCreateGroupModalVisible(false); setTimeout(() => setIsCreateFormOpen(true), 300); };
  const handleOpenGroupFromPost = (group: any) => { const fullGroup = groups.find(g => g.id === group.id); const targetGroup = fullGroup || group; if (selectedGroup?.id !== targetGroup.id) { setSelectedGroup(targetGroup); setActiveTab('feed'); } };

  // --- RENDERIZADORES ---
  const renderStories = () => (
    <View style={styles.storiesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContent}>
        {groups.map((group) => {
          if (group.isAction) {
            return (
              <TouchableOpacity key={group.id} style={styles.storyItem} onPress={handleCreateOrJoin}>
                <View style={styles.createStoryCircle}><MaterialCommunityIcons name="plus" size={28} color="#008E00" /></View>
                <Text style={styles.storyName}>Novo</Text>
              </TouchableOpacity>
            );
          }
          const isPaid = group.type === 'paid';
          return (
            <TouchableOpacity key={group.id} style={styles.storyItem} onPress={() => { setSelectedGroup(group); setActiveTab('feed'); }}>
              <View style={[styles.storyRing, isPaid ? styles.storyRingGold : styles.storyRingGreen, !group.hasUpdate && styles.storyRingGray]}>
                <Image source={{ uri: group.image }} style={styles.storyImage} />
                {group.rank && <View style={styles.rankStoryBadge}><Text style={styles.rankStoryText}>#{group.rank}</Text></View>}
                {isPaid && <View style={styles.paidBadge}><MaterialCommunityIcons name="crown" size={10} color="#FFF" /></View>}
              </View>
              <Text style={styles.storyName} numberOfLines={1}>{group.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderPostItem = ({ item }: { item: any }) => <PostItem item={item} onLike={handleLike} onValidate={handleValidate} onReport={handleReport} onOpenOptions={openPostOptions} onOpenGroup={handleOpenGroupFromPost} onComment={handleOpenComments} onOpenWorkout={setViewingPostWorkout} />;

  const renderRankingItem = ({ item, index }: { item: any, index: number }) => {
    let rankColor = '#9CA3AF'; let fontSize = 16;
    if (index === 0) { rankColor = '#F59E0B'; fontSize = 22; }
    else if (index === 1) { rankColor = '#94A3B8'; fontSize = 20; }
    else if (index === 2) { rankColor = '#D97706'; fontSize = 18; }
    return (
      <View style={[styles.rankRow, index === 0 && styles.rankRowFirst]}>
        <Text style={[styles.rankNumber, { color: rankColor, fontSize: fontSize }]}>{index + 1}º</Text>
        <Image source={{ uri: item.avatar }} style={styles.rankAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rankName}>{item.name}</Text>
          <View style={styles.rankBarBg}><View style={[styles.rankBarFill, { width: `${(item.xp / 3000) * 100}%` }]} /></View>
        </View>
        <View style={{ alignItems: 'flex-end' }}><Text style={styles.rankPoints}>{item.xp}</Text><Text style={styles.rankPtsLabel}>pts</Text></View>
        {index === 0 && <MaterialCommunityIcons name="crown" size={24} color="#F59E0B" style={{ marginLeft: 8 }} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<><View style={{ height: 10 }} />{renderStories()}</>}
        renderItem={renderPostItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={() => alert('Chat Geral')}><MaterialCommunityIcons name="chat-processing" size={28} color="#FFF" /></TouchableOpacity>

      {/* --- MODAIS DE OPÇÕES, COMENTÁRIOS E OUTROS --- */}

      {/* Opções de Post */}
      <Modal visible={optionsModalVisible} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setOptionsModalVisible(false)}><View style={styles.optionsModalBackdrop}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setOptionsModalVisible(false)} /><View style={[styles.optionsModalContent, { paddingBottom: insets.bottom + 20 }]}><View style={styles.optionsHeader}><View style={styles.optionsHandle} /><Text style={styles.optionsTitle}>Opções da Publicação</Text></View><TouchableOpacity style={styles.optionItem} onPress={() => handleOptionAction('profile')}><View style={[styles.optionIconBox, { backgroundColor: '#F3F4F6' }]}><MaterialCommunityIcons name="account-circle-outline" size={24} color="#191511" /></View><Text style={styles.optionText}>Ver Perfil</Text></TouchableOpacity><TouchableOpacity style={styles.optionItem} onPress={() => handleOptionAction('details')}><View style={[styles.optionIconBox, { backgroundColor: '#F3F4F6' }]}><MaterialCommunityIcons name="dumbbell" size={24} color="#191511" /></View><Text style={styles.optionText}>Ver Detalhes do Treino</Text></TouchableOpacity><TouchableOpacity style={[styles.optionItem, styles.optionItemDestructive]} onPress={() => handleOptionAction('report')}><View style={[styles.optionIconBox, { backgroundColor: '#FEF2F2' }]}><MaterialCommunityIcons name="flag-variant-outline" size={24} color="#EF4444" /></View><Text style={[styles.optionText, { color: '#EF4444' }]}>Denunciar Publicação</Text></TouchableOpacity><TouchableOpacity style={styles.optionCancelBtn} onPress={() => setOptionsModalVisible(false)}><Text style={styles.optionCancelText}>Cancelar</Text></TouchableOpacity></View></View></Modal>

      {/* Comentários */}
      <Modal visible={commentsModalVisible} transparent={true} animationType="slide" statusBarTranslucent navigationBarTranslucent={true} onRequestClose={() => setCommentsModalVisible(false)}><View style={{ flex: 1 }}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setCommentsModalVisible(false)} activeOpacity={1}><View style={styles.optionsModalBackdrop} /></TouchableOpacity><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.commentsModalContainer} pointerEvents="box-none"><View style={[styles.commentsModalContent, { height: '75%' }]}><View style={styles.optionsHeader}><View style={styles.optionsHandle} /><Text style={styles.optionsTitle}>Comentários</Text></View><FlatList data={COMMENTS_DATA} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 20, paddingBottom: 80 }} renderItem={({ item }) => (<View style={styles.commentItem}><Image source={{ uri: item.avatar }} style={styles.commentAvatar} /><View style={{ flex: 1 }}><View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}><Text style={styles.commentUser}>{item.user}</Text><Text style={styles.commentTime}>{item.time}</Text></View><Text style={styles.commentText}>{item.text}</Text></View></View>)} /><View style={[styles.commentInputContainer, { paddingBottom: insets.bottom + 10 }]}><TextInput style={styles.commentInput} placeholder="Adicione um comentário..." placeholderTextColor="#9CA3AF" value={newCommentText} onChangeText={setNewCommentText} /><TouchableOpacity onPress={handleSendComment} disabled={!newCommentText.trim()}><Text style={[styles.commentSendBtn, !newCommentText.trim() && { color: '#E5E7EB' }]}>Publicar</Text></TouchableOpacity></View></View></KeyboardAvoidingView></View></Modal>

      {/* Detalhes do Treino */}
      <Modal visible={!!viewingPostWorkout} transparent={true} animationType="slide" statusBarTranslucent onRequestClose={() => setViewingPostWorkout(null)}><View style={styles.modalBackdrop}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setViewingPostWorkout(null)} /><View style={[styles.detailModalContent, { paddingBottom: insets.bottom + 20 }]}><View style={styles.detailHeader}><View><Text style={styles.detailTitle}>{viewingPostWorkout?.workoutTitle}</Text><Text style={styles.detailSubtitle}>Treino de {viewingPostWorkout?.user.name}</Text></View><TouchableOpacity onPress={() => setViewingPostWorkout(null)} style={styles.closeIconBg}><MaterialCommunityIcons name="close" size={24} color="#191511" /></TouchableOpacity></View><View style={styles.wpStatsRow}><View style={styles.wpStatItem}><MaterialCommunityIcons name="weight-lifter" size={20} color="#008E00" /><Text style={styles.wpStatValue}>{viewingPostWorkout?.workoutStats.split('•')[0].trim()}</Text></View><View style={styles.wpStatItem}><MaterialCommunityIcons name="clock-outline" size={20} color="#3B82F6" /><Text style={styles.wpStatValue}>{viewingPostWorkout?.workoutStats.split('•')[1].trim()}</Text></View></View><Text style={styles.wpSectionTitle}>Exercícios Realizados</Text><ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>{MOCK_POST_WORKOUT_DETAILS.map((ex, i) => (<View key={i} style={styles.wpExerciseRow}><View style={styles.wpExIcon}><Text style={styles.wpExIndex}>{i + 1}</Text></View><View style={{ flex: 1 }}><Text style={styles.wpExName}>{ex.name}</Text><Text style={styles.wpExDetails}>{ex.sets} • {ex.load}</Text></View></View>))}</ScrollView><TouchableOpacity style={styles.wpCloneBtn} onPress={() => Alert.alert("Copiar Treino", "Treino salvo na sua biblioteca!")}><Text style={styles.wpCloneText}>Salvar este Treino</Text><MaterialCommunityIcons name="content-save-outline" size={20} color="#FFF" /></TouchableOpacity></View></View></Modal>

      {/* Menu Criar/Entrar */}
      <Modal visible={createGroupModalVisible} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setCreateGroupModalVisible(false)}><View style={styles.optionsModalBackdrop}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setCreateGroupModalVisible(false)} /><View style={[styles.optionsModalContent, { paddingBottom: insets.bottom + 20 }]}><View style={styles.optionsHeader}><View style={styles.optionsHandle} /><Text style={styles.optionsTitle}>Adicionar Grupo</Text></View><TouchableOpacity style={styles.optionItem} onPress={handleOpenCreateForm}><View style={[styles.optionIconBox, { backgroundColor: '#F0FDF4' }]}><MaterialCommunityIcons name="plus-circle-outline" size={24} color="#008E00" /></View><View><Text style={styles.optionText}>Criar Novo Grupo</Text><Text style={styles.optionSubText}>Comece uma competição do zero</Text></View></TouchableOpacity><TouchableOpacity style={styles.optionItem} onPress={handleOpenJoinCode}><View style={[styles.optionIconBox, { backgroundColor: '#F3F4F6' }]}><MaterialCommunityIcons name="login-variant" size={24} color="#191511" /></View><View><Text style={styles.optionText}>Entrar com Código</Text><Text style={styles.optionSubText}>Participe de um grupo existente</Text></View></TouchableOpacity><TouchableOpacity style={styles.optionCancelBtn} onPress={() => setCreateGroupModalVisible(false)}><Text style={styles.optionCancelText}>Cancelar</Text></TouchableOpacity></View></View></Modal>

      {/* Inserir Código */}
      <Modal visible={isJoinCodeModalOpen} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setIsJoinCodeModalOpen(false)}><View style={styles.optionsModalBackdrop}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsJoinCodeModalOpen(false)} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}><View style={[styles.optionsModalContent, { paddingBottom: insets.bottom + 20 }]}><View style={styles.optionsHeader}><View style={styles.optionsHandle} /><Text style={styles.optionsTitle}>Entrar em Grupo</Text></View><Text style={styles.inputLabel}>Código do Convite</Text><TextInput style={styles.input} placeholder="#123456" value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" /><TouchableOpacity style={styles.createBtnMain} onPress={handleSearchGroup}><Text style={styles.createBtnText}>BUSCAR GRUPO</Text></TouchableOpacity></View></KeyboardAvoidingView></View></Modal>

      {/* Detalhes para Entrar */}
      <Modal visible={isJoinDetailsModalOpen} transparent={true} animationType="slide" statusBarTranslucent onRequestClose={() => setIsJoinDetailsModalOpen(false)}><View style={styles.modalBackdrop}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsJoinDetailsModalOpen(false)} /><View style={[styles.detailModalContent, { paddingBottom: insets.bottom + 20 }]}><View style={styles.detailHeader}><View><Text style={styles.detailTitle}>{previewGroup?.name}</Text><Text style={styles.detailSubtitle}>{previewGroup?.type === 'paid' ? 'Competição Paga' : 'Grupo Privado'}</Text></View><TouchableOpacity onPress={() => setIsJoinDetailsModalOpen(false)} style={styles.closeIconBg}><MaterialCommunityIcons name="close" size={24} color="#191511" /></TouchableOpacity></View><Image source={{ uri: previewGroup?.image }} style={styles.joinPreviewImage} /><Text style={styles.joinPreviewDesc}>{previewGroup?.description}</Text><View style={styles.joinMetaRow}><View style={styles.joinMetaItem}><MaterialCommunityIcons name="account-group" size={20} color="#6B7280" /><Text style={styles.joinMetaText}>{previewGroup?.members} membros</Text></View><View style={styles.joinMetaItem}><MaterialCommunityIcons name="clock-outline" size={20} color="#6B7280" /><Text style={styles.joinMetaText}>{previewGroup?.duration}</Text></View></View>{previewGroup?.type === 'paid' && (<View style={styles.prizeBox}><Text style={styles.prizeBoxLabel}>PRÊMIO TOTAL</Text><Text style={styles.prizeBoxValue}>{previewGroup?.prize}</Text></View>)}<TouchableOpacity style={styles.createBtnMain} onPress={handleConfirmJoin}><Text style={styles.createBtnText}>ENTRAR NO GRUPO</Text></TouchableOpacity></View></View></Modal>

      {/* Formulário de Criação */}
      <Modal visible={isCreateFormOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsCreateFormOpen(false)}><View style={styles.modalContainer}><View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}><TouchableOpacity onPress={() => setIsCreateFormOpen(false)} style={styles.modalCloseBtn}><MaterialCommunityIcons name="close" size={28} color="#191511" /></TouchableOpacity><Text style={styles.modalGroupName}>Novo Grupo</Text><View style={{ width: 40 }} /></View><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={{ padding: 24 }}><Text style={styles.inputLabel}>Nome do Grupo</Text><TextInput style={styles.input} placeholder="Ex: Projeto Verão, Só os Fortes..." value={newGroupName} onChangeText={setNewGroupName} /><Text style={styles.inputLabel}>Descrição</Text><TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Regras, objetivos, etc..." multiline value={newGroupDesc} onChangeText={setNewGroupDesc} /><Text style={styles.inputLabel}>Tipo de Competição</Text><View style={styles.typeSelector}><TouchableOpacity style={[styles.typeOption, newGroupType === 'private' && styles.typeOptionActive]} onPress={() => setNewGroupType('private')}><MaterialCommunityIcons name="account-group" size={24} color={newGroupType === 'private' ? '#008E00' : '#6B7280'} /><Text style={[styles.typeText, newGroupType === 'private' && styles.typeTextActive]}>Diversão (Grátis)</Text></TouchableOpacity><TouchableOpacity style={[styles.typeOption, newGroupType === 'paid' && styles.typeOptionActiveGold]} onPress={() => setNewGroupType('paid')}><MaterialCommunityIcons name="trophy" size={24} color={newGroupType === 'paid' ? '#F59E0B' : '#6B7280'} /><Text style={[styles.typeText, newGroupType === 'paid' && styles.typeTextActiveGold]}>Arena (Pago)</Text></TouchableOpacity></View><Text style={styles.inputLabel}>Duração do Desafio</Text><View style={styles.durationSelector}>{['Semanal', 'Quinzenal', 'Mensal'].map(d => (<TouchableOpacity key={d} style={[styles.durationPill, newGroupDuration === d && styles.durationPillActive]} onPress={() => setNewGroupDuration(d)}><Text style={[styles.durationText, newGroupDuration === d && styles.durationTextActive]}>{d}</Text></TouchableOpacity>))}</View><TouchableOpacity style={styles.createBtnMain} onPress={handleCreateNewGroup}><Text style={styles.createBtnText}>CRIAR GRUPO</Text></TouchableOpacity></ScrollView></KeyboardAvoidingView></View></Modal>

      {/* Modal do Grupo Selecionado */}
      <Modal visible={!!selectedGroup} animationType="slide" statusBarTranslucent onRequestClose={() => setSelectedGroup(null)}><View style={styles.modalContainer}><View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}><TouchableOpacity onPress={() => setSelectedGroup(null)} style={styles.modalCloseBtn}><MaterialCommunityIcons name="chevron-down" size={28} color="#191511" /></TouchableOpacity><View style={{ alignItems: 'center' }}><Text style={styles.modalGroupName}>{selectedGroup?.name}</Text><Text style={styles.modalGroupType}>{selectedGroup?.type === 'paid' ? 'Competição Paga' : 'Grupo Privado'}</Text></View><TouchableOpacity style={styles.modalSettingsBtn}><MaterialCommunityIcons name="cog-outline" size={24} color="#191511" /></TouchableOpacity></View><View style={styles.groupTabs}><TouchableOpacity style={[styles.groupTab, activeTab === 'feed' && styles.groupTabActive]} onPress={() => setActiveTab('feed')}><Text style={[styles.groupTabText, activeTab === 'feed' && styles.groupTabTextActive]}>Feed</Text></TouchableOpacity><TouchableOpacity style={[styles.groupTab, activeTab === 'ranking' && styles.groupTabActive]} onPress={() => setActiveTab('ranking')}><Text style={[styles.groupTabText, activeTab === 'ranking' && styles.groupTabTextActive]}>Ranking</Text></TouchableOpacity></View>{activeTab === 'feed' ? (<FlatList data={posts.filter(p => p.group?.id === selectedGroup?.id)} keyExtractor={(item) => item.id} renderItem={renderPostItem} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} ListEmptyComponent={<Text style={styles.emptyText}>Nenhum post neste grupo ainda.</Text>} />) : (<FlatList data={GROUP_RANKING} keyExtractor={(item) => item.id.toString()} renderItem={renderRankingItem} contentContainerStyle={{ padding: 20 }} ListHeaderComponent={selectedGroup?.prize && <View style={styles.prizeHeader}><Text style={styles.prizeText}>🏆 Pote Atual: {selectedGroup.prize}</Text></View>} />)}</View></Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // STORIES
  storiesContainer: { paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  storiesContent: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: 'center', width: 72 },
  storyRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, padding: 3, justifyContent: 'center', alignItems: 'center' },
  storyRingGreen: { borderColor: '#008E00' },
  storyRingGold: { borderColor: '#F59E0B' },
  storyRingGray: { borderColor: '#E5E7EB' },
  createStoryCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  storyImage: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: '#E5E7EB' },
  storyName: { fontSize: 11, color: '#191511', marginTop: 4, fontWeight: '500', textAlign: 'center' },
  paidBadge: { position: 'absolute', bottom: -2, right: 0, backgroundColor: '#F59E0B', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FAFAFA' },
  rankStoryBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#191511', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1.5, borderColor: '#FFF', zIndex: 10 },
  rankStoryText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  // FEED POST
  postContainer: { marginTop: 24, paddingHorizontal: 0 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  postOptionsBtn: { padding: 4 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB' },
  userName: { fontSize: 14, fontWeight: '700', color: '#191511' },
  groupNameSmall: { fontSize: 12, color: '#008E00', fontWeight: '600' },
  timeAgo: { fontSize: 12, color: '#9CA3AF' },
  dotSeparator: { fontSize: 12, color: '#9CA3AF', marginHorizontal: 2 },
  imageWrapper: { width: width, height: width * 1.1, position: 'relative', backgroundColor: '#F3F4F6' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  workoutInfoOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(25, 21, 17, 0.85)', padding: 12, borderRadius: 16 },
  workoutIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  workoutTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  workoutStats: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 12 },
  gameActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  btnValidate: { backgroundColor: '#191511', borderColor: '#191511' },
  btnValidated: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  btnReport: { backgroundColor: '#FFF', borderColor: '#FCA5A5' },
  btnReported: { backgroundColor: '#FEF2F2', borderColor: 'transparent' },
  gameActionText: { fontSize: 13, fontWeight: '700' },
  likesText: { paddingHorizontal: 16, marginTop: 8, fontSize: 13, fontWeight: '700', color: '#191511' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#191511', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 50 },
  modalContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalCloseBtn: { padding: 8 },
  modalSettingsBtn: { padding: 8 },
  modalGroupName: { fontSize: 18, fontWeight: '800', color: '#191511' },
  modalGroupType: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  groupTabs: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 8, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  groupTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  groupTabActive: { backgroundColor: '#FFF', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  groupTabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  groupTabTextActive: { color: '#191511', fontWeight: '800' },
  prizeHeader: { alignItems: 'center', marginBottom: 20, padding: 12, backgroundColor: '#FFF7ED', borderRadius: 12, borderWidth: 1, borderColor: '#FED7AA' },
  prizeText: { color: '#D97706', fontWeight: '800', fontSize: 16 },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  rankRowFirst: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  rankNumber: { fontWeight: '800', width: 30, textAlign: 'center' },
  rankAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  rankName: { fontSize: 14, fontWeight: '700', color: '#191511', marginBottom: 4 },
  rankBarBg: { height: 4, width: 100, backgroundColor: '#F3F4F6', borderRadius: 2 },
  rankBarFill: { height: '100%', backgroundColor: '#008E00', borderRadius: 2 },
  rankPoints: { fontSize: 16, fontWeight: '800', color: '#191511' },
  rankPtsLabel: { fontSize: 10, color: '#9CA3AF' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF', fontStyle: 'italic' },
  optionsModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  optionsModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  optionsHeader: { alignItems: 'center', marginBottom: 20 },
  optionsHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 12 },
  optionsTitle: { fontSize: 16, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase' },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionItemDestructive: { borderBottomWidth: 0 },
  optionIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionText: { fontSize: 16, fontWeight: '700', color: '#191511' },
  optionSubText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  optionCancelBtn: { marginTop: 12, paddingVertical: 16, alignItems: 'center', borderRadius: 16, backgroundColor: '#F3F4F6' },
  optionCancelText: { fontSize: 16, fontWeight: '800', color: '#191511' },
  commentsModalContainer: { flex: 1, justifyContent: 'flex-end' },
  commentsModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 0, overflow: 'hidden' },
  commentItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB' },
  commentUser: { fontSize: 13, fontWeight: '700', color: '#191511' },
  commentTime: { fontSize: 11, color: '#9CA3AF' },
  commentText: { fontSize: 14, color: '#374151', marginTop: 2 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFF' },
  commentInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#191511' },
  commentSendBtn: { fontWeight: '700', color: '#008E00' },
  wpStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  wpStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  wpStatValue: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  wpSectionTitle: { fontSize: 16, fontWeight: '800', color: '#191511', marginBottom: 12 },
  wpExerciseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  wpExIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  wpExIndex: { fontSize: 12, fontWeight: '800', color: '#9CA3AF' },
  wpExName: { fontSize: 14, fontWeight: '700', color: '#191511' },
  wpExDetails: { fontSize: 12, color: '#6B7280' },
  wpCloneBtn: { flexDirection: 'row', backgroundColor: '#191511', paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 },
  wpCloneText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#191511', marginBottom: 24, borderWidth: 1, borderColor: 'transparent' },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeOption: { flex: 1, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', gap: 8 },
  typeOptionActive: { backgroundColor: '#F0FDF4', borderColor: '#008E00' },
  typeOptionActiveGold: { backgroundColor: '#FFF7ED', borderColor: '#F59E0B' },
  typeText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  typeTextActive: { color: '#008E00' },
  typeTextActiveGold: { color: '#F59E0B' },
  durationSelector: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  durationPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  durationPillActive: { backgroundColor: '#191511' },
  durationText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  durationTextActive: { color: '#FFF' },
  createBtnMain: { backgroundColor: '#008E00', paddingVertical: 16, borderRadius: 16, alignItems: 'center', width: '100%' },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },
  detailSubtitle: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  closeIconBg: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
  joinPreviewImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 16, backgroundColor: '#E5E7EB' },
  joinPreviewDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 20 },
  joinMetaRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  joinMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  joinMetaText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  prizeBox: { backgroundColor: '#FFF7ED', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FED7AA', marginBottom: 24 },
  prizeBoxLabel: { fontSize: 12, fontWeight: '800', color: '#9A3412', marginBottom: 4 },
  prizeBoxValue: { fontSize: 24, fontWeight: '900', color: '#D97706' },
});