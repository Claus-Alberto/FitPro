import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Modal,
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
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- TYPES ---
type MarketItem = {
    id: string;
    name: string;
    quantity: string; // Ex: "1kg", "2 un"
    category: 'hortifruti' | 'mercearia' | 'acougue' | 'frios' | 'padaria' | 'bebidas' | 'higiene' | 'limpeza' | 'congelados' | 'pet' | 'suplementos' | 'outros';
    isChecked: boolean;
};

type Category = {
    id: MarketItem['category'];
    label: string;
    color: string;
    icon: string;
};

// --- DATA ---
const CATEGORIES: Category[] = [
    { id: 'acougue', label: 'Açougue e Proteínas', color: '#EF4444', icon: 'food-drumstick' },
    { id: 'hortifruti', label: 'Hortifruti', color: '#10B981', icon: 'food-apple' },
    { id: 'mercearia', label: 'Mercearia e Grãos', color: '#F59E0B', icon: 'basket' },
    { id: 'frios', label: 'Frios e Laticínios', color: '#FCD34D', icon: 'cheese' },
    { id: 'suplementos', label: 'Suplementação', color: '#8B5CF6', icon: 'bottle-tonic-plus' },
    { id: 'congelados', label: 'Congelados', color: '#3B82F6', icon: 'snowflake' },
    { id: 'padaria', label: 'Padaria', color: '#D97706', icon: 'bread-slice' },
    { id: 'bebidas', label: 'Bebidas', color: '#06B6D4', icon: 'bottle-wine' },
    { id: 'higiene', label: 'Higiene e Beleza', color: '#EC4899', icon: 'toothbrush-paste' },
    { id: 'limpeza', label: 'Limpeza', color: '#6B7280', icon: 'spray-bottle' },
    { id: 'pet', label: 'Pet Shop', color: '#A78BFA', icon: 'paw' },
    { id: 'outros', label: 'Outros', color: '#9CA3AF', icon: 'dots-horizontal' },
];

const INITIAL_ITEMS: MarketItem[] = [
    { id: '1', name: 'Peito de Frango', quantity: '2kg', category: 'acougue', isChecked: false },
    { id: '2', name: 'Ovos', quantity: '30 un', category: 'frios', isChecked: false },
    { id: '3', name: 'Arroz Integral', quantity: '1kg', category: 'mercearia', isChecked: true },
    { id: '4', name: 'Whey Protein', quantity: '1 pote', category: 'suplementos', isChecked: false },
    { id: '5', name: 'Brócolis', quantity: '2 un', category: 'hortifruti', isChecked: false },
];

// --- COMPONENTS ---
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRing = ({ size, progress, strokeWidth, color, children }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const animatedProgress = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: Math.min(Math.max(progress, 0), 1),
            duration: 1000,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false
        }).start();
    }, [progress]);

    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0]
    });

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <Circle stroke="rgba(0,0,0,0.05)" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" />
                <AnimatedCircle
                    stroke={color}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                {children}
            </View>
        </View>
    );
};

export default function MarketScreen() {
    const insets = useSafeAreaInsets();
    const [items, setItems] = useState<MarketItem[]>(INITIAL_ITEMS);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category['id']>('hortifruti');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [totalCost, setTotalCost] = useState('');

    // Computed
    const totalItems = items.length;
    const checkedItems = items.filter(i => i.isChecked).length;
    const progress = totalItems > 0 ? checkedItems / totalItems : 0;

    // Actions
    const toggleItem = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, isChecked: !item.isChecked } : item
        ));
    };

    const deleteItem = (id: string) => {
        Alert.alert("Remover Item", "Tem certeza?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Remover", style: "destructive", onPress: () => setItems(prev => prev.filter(i => i.id !== id)) }
        ]);
    };

    const addItem = () => {
        if (!newItemName.trim()) return;
        const newItem: MarketItem = {
            id: Math.random().toString(),
            name: newItemName,
            quantity: newItemQty || '1 un',
            category: selectedCategory,
            isChecked: false
        };
        setItems(prev => [...prev, newItem]);
        setNewItemName('');
        setNewItemQty('');
        setIsAddModalOpen(false);
    };

    const handleImportDiet = () => {
        Alert.alert(
            "Importar da Dieta",
            "Isso adicionará os itens do seu plano alimentar semanal à lista.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Importar", onPress: () => {
                        const dietItems: MarketItem[] = [
                            { id: Math.random().toString(), name: 'Batata Doce', quantity: '3kg', category: 'hortifruti', isChecked: false },
                            { id: Math.random().toString(), name: 'Patinho Moído', quantity: '1.5kg', category: 'acougue', isChecked: false },
                            { id: Math.random().toString(), name: 'Banana Prata', quantity: '12 un', category: 'hortifruti', isChecked: false },
                        ];
                        setItems(prev => [...prev, ...dietItems]);
                        Alert.alert("Sucesso", "3 itens importados da dieta!");
                    }
                }
            ]
        );
    };

    const handleRestockEssentials = () => {
        const essentials: MarketItem[] = [
            { id: Math.random().toString(), name: 'Água Mineral', quantity: '6x 1.5L', category: 'bebidas', isChecked: false },
            { id: Math.random().toString(), name: 'Papel Toalha', quantity: '2 rolos', category: 'limpeza', isChecked: false },
            { id: Math.random().toString(), name: 'Creatina', quantity: '1 pote', category: 'suplementos', isChecked: false },
        ];
        setItems(prev => [...prev, ...essentials]);
        Alert.alert("Sucesso", "Itens essenciais adicionados!");
    };

    const handleFinishPurchase = () => {
        if (!totalCost) return Alert.alert("Erro", "Informe o valor total da compra.");

        // Simulação de XP e Finalização
        Alert.alert(
            "Compra Finalizada! 🎉",
            `Você ganhou +150 XP de Preparação!\nCusto Total: R$ ${totalCost}`,
            [{
                text: "Show!", onPress: () => {
                    setItems(prev => prev.filter(i => !i.isChecked)); // Remove comprados
                    setIsCheckoutOpen(false);
                    setTotalCost('');
                }
            }]
        );
    };

    const renderCategory = (catId: string) => {
        const catItems = items.filter(i => i.category === catId);
        if (catItems.length === 0) return null;

        const catInfo = CATEGORIES.find(c => c.id === catId)!;

        return (
            <View key={catId} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                    <View style={[styles.catIcon, { backgroundColor: `${catInfo.color}20` }]}>
                        <MaterialCommunityIcons name={catInfo.icon as any} size={16} color={catInfo.color} />
                    </View>
                    <Text style={[styles.catTitle, { color: catInfo.color }]}>{catInfo.label}</Text>
                </View>
                {catItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.itemRow, item.isChecked && styles.itemRowChecked]}
                        onPress={() => toggleItem(item.id)}
                        onLongPress={() => deleteItem(item.id)}
                        delayLongPress={500}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, item.isChecked && { backgroundColor: catInfo.color, borderColor: catInfo.color }]}>
                            {item.isChecked && <MaterialCommunityIcons name="check" size={16} color="#FFF" />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>{item.name}</Text>
                            <Text style={styles.itemQty}>{item.quantity}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View>
                        <Text style={styles.headerTitle}>Smart Pantry</Text>
                        <Text style={styles.headerSubtitle}>{checkedItems} de {totalItems} itens no carrinho</Text>
                    </View>
                    <ProgressRing size={50} progress={progress} strokeWidth={5} color="#008E00">
                        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                    </ProgressRing>
                </View>

                {/* MAGIC ACTIONS */}
                <View style={styles.magicActions}>
                    <TouchableOpacity style={styles.magicBtn} onPress={handleImportDiet}>
                        <MaterialCommunityIcons name="food-apple-outline" size={20} color="#008E00" />
                        <Text style={styles.magicBtnText}>Importar da Dieta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.magicBtn} onPress={handleRestockEssentials}>
                        <MaterialCommunityIcons name="flash-outline" size={20} color="#F59E0B" />
                        <Text style={[styles.magicBtnText, { color: '#F59E0B' }]}>Repor Essenciais</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}>
                {CATEGORIES.map(cat => renderCategory(cat.id))}
                {items.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="cart-variant" size={64} color="#E5E7EB" />
                        <Text style={styles.emptyText}>Sua despensa está cheia!</Text>
                        <Text style={styles.emptySubtext}>Use os botões acima para planejar a semana.</Text>
                    </View>
                )}
            </ScrollView>

            {/* CHECKOUT BAR */}
            {checkedItems > 0 && (
                <View style={[styles.checkoutBar, { bottom: 20 + insets.bottom }]}>
                    <View style={styles.checkoutInfo}>
                        <View style={styles.checkoutBadge}>
                            <Text style={styles.checkoutBadgeText}>{checkedItems}</Text>
                        </View>
                        <Text style={styles.checkoutText}>Itens marcados</Text>
                    </View>
                    <TouchableOpacity style={styles.checkoutBtn} onPress={() => setIsCheckoutOpen(true)}>
                        <Text style={styles.checkoutBtnText}>Concluir</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: (checkedItems > 0 ? 90 : 20) + insets.bottom }]}
                onPress={() => setIsAddModalOpen(true)}
            >
                <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* ADD MODAL */}
            <Modal visible={isAddModalOpen} transparent animationType="slide" onRequestClose={() => setIsAddModalOpen(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsAddModalOpen(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableOpacity>

                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Adicionar Item</Text>
                            <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.label}>Nome</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Whey..."
                                    value={newItemName}
                                    onChangeText={setNewItemName}
                                    autoFocus
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Qtd</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: 1kg"
                                    value={newItemQty}
                                    onChangeText={setNewItemQty}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Corredor (Categoria)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 20 }}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.catPill,
                                        selectedCategory === cat.id && { backgroundColor: `${cat.color}20`, borderColor: cat.color }
                                    ]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <MaterialCommunityIcons
                                        name={cat.icon as any}
                                        size={16}
                                        color={selectedCategory === cat.id ? cat.color : '#9CA3AF'}
                                    />
                                    <Text style={[
                                        styles.catPillText,
                                        selectedCategory === cat.id && { color: cat.color, fontWeight: '700' }
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                            <Text style={styles.addBtnText}>ADICIONAR À LISTA</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* CHECKOUT MODAL */}
            <Modal visible={isCheckoutOpen} transparent animationType="fade" onRequestClose={() => setIsCheckoutOpen(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsCheckoutOpen(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableOpacity>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                                <MaterialCommunityIcons name="check-decagram" size={32} color="#008E00" />
                            </View>
                            <Text style={styles.modalTitle}>Finalizar Compra</Text>
                            <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
                                Parabéns! Você completou {checkedItems} itens da sua lista.
                                Registre o valor para ganhar XP.
                            </Text>
                        </View>

                        <Text style={styles.label}>Valor Total (R$)</Text>
                        <TextInput
                            style={[styles.input, { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#008E00' }]}
                            placeholder="0,00"
                            keyboardType="numeric"
                            value={totalCost}
                            onChangeText={setTotalCost}
                            autoFocus
                        />

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#008E00' }]} onPress={handleFinishPurchase}>
                            <Text style={styles.addBtnText}>CONFIRMAR E GANHAR XP</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
        zIndex: 10
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#191511' },
    headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    progressText: { fontSize: 10, fontWeight: '800', color: '#008E00' },

    magicActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    magicBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    magicBtnText: { fontSize: 12, fontWeight: '700', color: '#008E00' },

    categorySection: { marginTop: 24 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    catIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    catTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    itemRowChecked: { opacity: 0.5, backgroundColor: '#F9FAFB', borderColor: 'transparent', shadowOpacity: 0 },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    itemName: { fontSize: 16, fontWeight: '600', color: '#191511' },
    itemNameChecked: { textDecorationLine: 'line-through', color: '#9CA3AF' },
    itemQty: { fontSize: 13, color: '#6B7280', marginTop: 2 },

    emptyState: { alignItems: 'center', marginTop: 80, opacity: 0.6 },
    emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },

    fab: {
        position: 'absolute',
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#191511',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 20
    },

    checkoutBar: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#191511',
        borderRadius: 20,
        padding: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 15
    },
    checkoutInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checkoutBadge: { backgroundColor: '#008E00', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    checkoutBadgeText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
    checkoutText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    checkoutBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },

    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#191511',
        marginBottom: 20
    },
    label: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
    catSelector: { flexDirection: 'row', gap: 8 },
    catPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6
    },
    catPillText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },

    addBtn: { backgroundColor: '#191511', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});
