import ALL_STRINGS from '../../../constants/strings.json';
const STRINGS = ALL_STRINGS.diet;
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING } from '../../../constants/theme';

import ProgressRing from '../../../components/ProgressRing';
import WaterModal from '../../../components/WaterModal';
import CreationMenuModal from '../components/CreationMenuModal';
import CustomFoodModal from '../components/CustomFoodModal';
import FoodSearchModal from '../components/FoodSearchModal';
import MealDetailModal from '../components/MealDetailModal';
import NewMealModal from '../components/NewMealModal';
import PhotoAnalysisModal from '../components/PhotoAnalysisModal';
import QuantityModal from '../components/QuantityModal';
import RecipeBuilderModal, { RecipeIngredient } from '../components/RecipeBuilderModal';
import ScannedProductModal from '../components/ScannedProductModal';
import { useDiet } from '../hooks/useDiet';
import { DietService, FoodEntry, Meal, MealItem } from '../services/DietService';

const { width } = Dimensions.get('window');

const MacroBar = ({ label, current, total, color }: { label: string; current: number; total: number; color: string }) => {
  const widthAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    Animated.timing(widthAnim, { toValue: percentage, duration: 1000, easing: Easing.out(Easing.exp), useNativeDriver: false }).start();
  }, [current, total]);
  const widthInterpolated = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}><Text style={styles.macroLabel}>{label}</Text><Text style={styles.macroValue}>{Math.round(current)}/{total}g</Text></View>
      <View style={styles.progressBarBg}><Animated.View style={[styles.progressBarFill, { width: widthInterpolated, backgroundColor: color }]} /></View>
    </View>
  );
};

/**
 * @description Tela de Dieta — diário alimentar do dia, hidratação e metas nutricionais. Todo o
 * estado real (refeições/itens/água/metas) vem de `useDiet()`, que por sua vez fala com o SQLite
 * via `DietService`; esta tela só guarda estado efêmero de UI (qual modal está aberto, seleção
 * em andamento). Os ~10 modais originais foram extraídos para `src/features/diet/components/`.
 */
export default function DietScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const {
    meals, goals, totals, water, waterGoal, isLoading,
    addFoodToMeal, updateMealItem, removeMealItem, clearMealItems,
    createMeal, deleteMeal, addWater, setWaterGoal,
  } = useDiet();

  // Modais
  const [isNewMealOpen, setIsNewMealOpen] = useState(false);
  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState(false);
  const [isQuantityOpen, setIsQuantityOpen] = useState(false);
  const [isCreationMenuOpen, setIsCreationMenuOpen] = useState(false);
  const [isCustomFoodOpen, setIsCustomFoodOpen] = useState(false);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isMealDetailOpen, setIsMealDetailOpen] = useState(false);
  const [isWaterOpen, setIsWaterOpen] = useState(false);
  const [isScannedOpen, setIsScannedOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  // Scanner (câmera em tela cheia — não é um bottom-sheet, fica inline aqui)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<FoodEntry | null>(null);
  const [scanTargetMealId, setScanTargetMealId] = useState<string | null>(null);

  // Foto do prato
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Seleção / edição em andamento
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodEntry | null>(null);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [quantityMode, setQuantityMode] = useState<'add' | 'update' | 'ingredient'>('add');
  const [quantityInitialGrams, setQuantityInitialGrams] = useState<number | undefined>(undefined);

  // Receita em construção
  const [isSelectingIngredient, setIsSelectingIngredient] = useState(false);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  const currentMeal = useMemo<Meal | null>(() => meals.find((m) => m.id === selectedMealId) || null, [meals, selectedMealId]);
  const remainingCalories = Math.round(goals.kcal - totals.kcal);
  const caloriesProgress = goals.kcal > 0 ? totals.kcal / goals.kcal : 0;
  const missingProtein = Math.max(0, Math.round(goals.protein - totals.protein));

  // --- HELPERS ---

  /** @description Refeição cujo horário está mais próximo de agora — usada como sugestão de destino ao escanear/tirar foto. */
  function findClosestMealId(): string | null {
    if (meals.length === 0) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let closestId = meals[0].id;
    let minDiff = Infinity;
    meals.forEach((meal) => {
      const [h, m] = meal.time.split(':').map(Number);
      const diff = Math.abs((h * 60 + m) - currentMinutes);
      if (diff < minDiff) { minDiff = diff; closestId = meal.id; }
    });
    return closestId;
  }

  // --- NAVEGAÇÃO ENTRE MODAIS ---

  function openMealDetail(mealId: string) { setSelectedMealId(mealId); setIsMealDetailOpen(true); }

  function openFoodSearch(mealId: string | null) {
    if (!mealId) return;
    setSelectedMealId(mealId);
    setIsSelectingIngredient(false);
    setEditingItem(null);
    setIsMealDetailOpen(false);
    setIsFoodSearchOpen(true);
  }

  function closeFoodSearch() {
    setIsFoodSearchOpen(false);
    if (isSelectingIngredient) {
      setIsSelectingIngredient(false);
      setIsRecipeOpen(true);
    }
  }

  function handleSelectFood(food: FoodEntry) {
    setSelectedFood(food);
    setEditingItem(null);
    setQuantityMode(isSelectingIngredient ? 'ingredient' : 'add');
    setQuantityInitialGrams(undefined);
    setIsQuantityOpen(true);
  }

  /** @description Reabre o item já lançado para edição — busca o alimento original em `Foods` pelo `food_id` para recalcular macros; se não existir mais (ex: alimento apagado), reconstrói uma taxa por 100g aproximada a partir dos macros já gravados no item. */
  async function handleEditItem(item: MealItem) {
    let food: FoodEntry | null = item.food_id ? await DietService.getFoodById(item.food_id) : null;
    if (!food) {
      const rate = item.quantity > 0 ? 100 / item.quantity : 0;
      food = {
        id: item.food_id || item.id,
        name: item.food_name,
        category: null,
        kcal_100g: item.kcal * rate,
        protein_100g: item.protein * rate,
        carb_100g: item.carbs * rate,
        fat_100g: item.fat * rate,
        fiber_100g: 0,
        sodium_100g_mg: 0,
        source: 'custom',
        barcode: null,
      };
    }
    setEditingItem(item);
    setSelectedFood(food);
    setQuantityMode('update');
    setQuantityInitialGrams(item.quantity);
    setIsMealDetailOpen(false);
    setIsQuantityOpen(true);
  }

  async function handleConfirmQuantity(grams: number) {
    if (!selectedFood) return;

    if (quantityMode === 'ingredient') {
      setRecipeIngredients((prev) => [...prev, { food: selectedFood, quantityGrams: grams }]);
      setIsQuantityOpen(false);
      setIsFoodSearchOpen(false);
      setIsSelectingIngredient(false);
      setSelectedFood(null);
      setIsRecipeOpen(true);
      return;
    }

    if (editingItem) {
      await updateMealItem(editingItem.id, grams, 'g', selectedFood);
      setEditingItem(null);
    } else {
      if (!selectedMealId) {
        Alert.alert(ALL_STRINGS.diet.alerts.error, STRINGS.modals.quantity.errorMeal);
        return;
      }
      await addFoodToMeal(selectedMealId, selectedFood, grams, 'g');
    }
    setIsQuantityOpen(false);
    setIsFoodSearchOpen(false);
    setSelectedFood(null);
  }

  function startAddIngredient() {
    setIsSelectingIngredient(true);
    setIsRecipeOpen(false);
    setIsFoodSearchOpen(true);
  }

  function handleOpenCreationMenu() { setIsCreationMenuOpen(true); }

  async function handleTakeMealPhoto() {
    setIsCreationMenuOpen(false);
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      Alert.alert(STRINGS.modals.photo.permissionTitle, STRINGS.modals.photo.permissionMsg);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setIsPhotoOpen(true);
    }
  }

  /** @description Não existe reconhecimento automático de prato configurado neste app — leva direto pro fluxo manual de busca/cadastro, na refeição selecionada (ou a mais próxima do horário atual). */
  function handlePhotoAddManually() {
    setIsPhotoOpen(false);
    setPhotoUri(null);
    openFoodSearch(selectedMealId || findClosestMealId());
  }

  function handleCustomFoodCreated(food: FoodEntry) {
    setIsCustomFoodOpen(false);
    Alert.alert(ALL_STRINGS.diet.alerts.success, STRINGS.modals.customFood.success);
  }

  async function handleSaveRecipe(name: string, servings: number) {
    const recipe = await DietService.createRecipe(
      name,
      recipeIngredients.map((i) => ({ food: i.food, quantityGrams: i.quantityGrams })),
      servings
    );
    setRecipeIngredients([]);
    setIsRecipeOpen(false);
    Alert.alert(ALL_STRINGS.diet.alerts.success, STRINGS.modals.recipe.success);

    const targetMealId = selectedMealId || findClosestMealId();
    setSelectedMealId(targetMealId);
    setSelectedFood(recipe);
    setEditingItem(null);
    setQuantityMode('add');
    setQuantityInitialGrams(recipe.suggestedGramsPerServing);
    setIsQuantityOpen(true);
  }

  // --- ÁGUA ---

  function handleAddWater(ml: number) {
    addWater(ml);
  }

  // --- SCANNER ---

  function openScanner() {
    if (!permission) return;
    if (!permission.granted) { requestPermission(); return; }
    setScanLocked(false);
    setIsScannerOpen(true);
  }

  async function handleBarCodeScanned({ data }: { type: string; data: string }) {
    if (scanLocked) return;
    setScanLocked(true);
    setIsScannerOpen(false);
    const found = await DietService.lookupBarcode(data);
    if (found) {
      setScannedProduct(found);
      setScanTargetMealId(findClosestMealId());
      setIsScannedOpen(true);
    } else {
      Alert.alert(STRINGS.modals.scanner.notFoundTitle, STRINGS.modals.scanner.notFoundMsg);
      setIsCustomFoodOpen(true);
    }
  }

  function handleAddScannedProduct() {
    if (!scannedProduct) return;
    setIsScannedOpen(false);
    setSelectedMealId(scanTargetMealId);
    handleSelectFood(scannedProduct);
  }

  // --- REFEIÇÕES ---

  async function handleCreateMeal(title: string, time: string) {
    await createMeal(title, time);
    setIsNewMealOpen(false);
  }

  function handleClearItems() {
    if (!selectedMealId) return;
    Alert.alert(ALL_STRINGS.diet.alerts.clearMealTitle, ALL_STRINGS.diet.alerts.clearMealMsg, [
      { text: ALL_STRINGS.diet.alerts.cancel, style: 'cancel' },
      { text: ALL_STRINGS.diet.alerts.clear, onPress: () => clearMealItems(selectedMealId) },
    ]);
  }

  function handleDeleteMeal() {
    if (!currentMeal) return;
    const message = currentMeal.is_default ? `"${currentMeal.title}" ${ALL_STRINGS.diet.alerts.deleteMealMsgDefault}` : ALL_STRINGS.diet.alerts.deleteMealMsgCustom;
    Alert.alert(ALL_STRINGS.diet.alerts.deleteMealTitle, message, [
      { text: ALL_STRINGS.diet.alerts.cancel, style: 'cancel' },
      {
        text: ALL_STRINGS.diet.alerts.delete,
        style: 'destructive',
        onPress: () => { deleteMeal(currentMeal.id); setIsMealDetailOpen(false); },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.scoreBoard}>
          <View>
            <Text style={styles.scoreLabel}>{STRINGS.header.todayGoals}</Text>
            <Text style={styles.scoreValue}>{Math.round(caloriesProgress * 100)}%</Text>
          </View>
          <ProgressRing size={100} progress={caloriesProgress} strokeWidth={8} color={COLORS.primary} trackColor={COLORS.whiteOpacity10}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.ringValue}>{remainingCalories}</Text>
              <Text style={styles.ringLabel}>{STRINGS.header.kcal}</Text>
            </View>
          </ProgressRing>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.scoreLabel}>{STRINGS.header.consumed}</Text>
            <Text style={styles.scoreValue}>{Math.round(totals.kcal)}</Text>
          </View>
        </View>
        <View style={styles.macroRow}>
          <MacroBar label={STRINGS.header.protein} current={totals.protein} total={goals.protein} color={COLORS.primary} />
          <MacroBar label={STRINGS.header.carbs} current={totals.carbs} total={goals.carb} color={COLORS.info} />
          <MacroBar label={STRINGS.header.fat} current={totals.fat} total={goals.fat} color={COLORS.accent} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionIcon}><MaterialCommunityIcons name="chef-hat" size={24} color={COLORS.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.suggestionTitle}>{STRINGS.suggestion.title}</Text>
            <Text style={styles.suggestionText}>{STRINGS.suggestion.missingProtein} <Text style={{ fontWeight: '700', color: COLORS.primary }}>{missingProtein}{STRINGS.suggestion.proteinSuffix}</Text>.</Text>
          </View>
        </View>

        {isLoading && meals.length === 0 ? (
          <View style={{ paddingVertical: SPACING.huge, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.mealsContainer}>
            {meals.map((meal) => {
              const mealKcal = Math.round(meal.items.reduce((acc, i) => acc + i.kcal, 0));
              return (
                <TouchableOpacity key={meal.id} style={styles.mealCard} onPress={() => openMealDetail(meal.id)} activeOpacity={0.9}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealHeaderInfo}>
                      <View style={styles.mealIconBg}><MaterialCommunityIcons name={meal.icon as any} size={18} color={COLORS.secondary} /></View>
                      <View>
                        <Text style={styles.mealTitle}>{meal.title}</Text>
                        <Text style={styles.mealSubtext}>{meal.time} • <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{mealKcal} kcal</Text></Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.addMiniBtn} onPress={() => openFoodSearch(meal.id)}>
                      <MaterialCommunityIcons name="plus" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  {meal.items.length > 0 && (
                    <View style={styles.foodList}>
                      {meal.items.map((food) => (
                        <View key={food.id} style={styles.foodItem}>
                          <Text style={styles.foodName} numberOfLines={1}>{food.food_name}</Text>
                          <Text style={styles.foodKcal}>{Math.round(food.kcal)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {meal.items.length === 0 && (<Text style={styles.emptyMealText}>{STRINGS.meals.empty}</Text>)}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.createNewMealBtn} onPress={() => setIsNewMealOpen(true)}>
              <Text style={styles.createNewMealText}>{STRINGS.meals.createExtra}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, styles.fabWater]} onPress={() => setIsWaterOpen(true)}>
        <MaterialCommunityIcons name="water" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} onPress={openScanner}>
        <MaterialCommunityIcons name="barcode-scan" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* --- SCANNER (câmera em tela cheia) --- */}
      <Modal visible={isScannerOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={scanLocked ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8'] }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTop}>
              <Text style={styles.scannerTitle}>{STRINGS.modals.scanner.title}</Text>
              <Text style={styles.scannerSubtitle}>{STRINGS.modals.scanner.subtitle}</Text>
            </View>
            <View style={styles.scannerMiddle}><View style={styles.scannerWindow} /></View>
            <View style={styles.scannerBottom}>
              <TouchableOpacity style={styles.scannerCloseBtn} onPress={() => setIsScannerOpen(false)}>
                <MaterialCommunityIcons name="close" size={32} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <WaterModal
        visible={isWaterOpen}
        onClose={() => setIsWaterOpen(false)}
        current={water}
        goal={waterGoal}
        onAdd={handleAddWater}
        onChangeGoal={setWaterGoal}
      />

      <MealDetailModal
        visible={isMealDetailOpen}
        onClose={() => setIsMealDetailOpen(false)}
        meal={currentMeal}
        onEditItem={handleEditItem}
        onRemoveItem={removeMealItem}
        onAddFood={() => currentMeal && openFoodSearch(currentMeal.id)}
        onClearItems={handleClearItems}
        onDeleteMeal={handleDeleteMeal}
      />

      <NewMealModal visible={isNewMealOpen} onClose={() => setIsNewMealOpen(false)} onCreate={handleCreateMeal} />

      <FoodSearchModal
        visible={isFoodSearchOpen}
        mode={isSelectingIngredient ? 'ingredient' : 'meal'}
        onClose={closeFoodSearch}
        onSelect={handleSelectFood}
        onCreatePress={handleOpenCreationMenu}
      />

      <QuantityModal
        visible={isQuantityOpen}
        onClose={() => setIsQuantityOpen(false)}
        food={selectedFood}
        initialGrams={quantityInitialGrams}
        mode={quantityMode}
        onConfirm={handleConfirmQuantity}
      />

      <CreationMenuModal
        visible={isCreationMenuOpen}
        onClose={() => setIsCreationMenuOpen(false)}
        onPhotoPress={handleTakeMealPhoto}
        onCustomFoodPress={() => { setIsCreationMenuOpen(false); setIsCustomFoodOpen(true); }}
        onRecipePress={() => { setIsCreationMenuOpen(false); setRecipeIngredients([]); setIsRecipeOpen(true); }}
      />

      <CustomFoodModal visible={isCustomFoodOpen} onClose={() => setIsCustomFoodOpen(false)} onCreated={handleCustomFoodCreated} />

      <RecipeBuilderModal
        visible={isRecipeOpen}
        onClose={() => setIsRecipeOpen(false)}
        ingredients={recipeIngredients}
        onAddIngredientPress={startAddIngredient}
        onRemoveIngredient={(index) => setRecipeIngredients((prev) => prev.filter((_, i) => i !== index))}
        onSave={handleSaveRecipe}
      />

      <PhotoAnalysisModal
        visible={isPhotoOpen}
        onClose={() => { setIsPhotoOpen(false); setPhotoUri(null); }}
        photoUri={photoUri}
        onAddManually={handlePhotoAddManually}
      />

      <ScannedProductModal
        visible={isScannedOpen}
        onClose={() => setIsScannedOpen(false)}
        product={scannedProduct}
        meals={meals}
        targetMealId={scanTargetMealId}
        onSelectTargetMeal={setScanTargetMealId}
        onConfirm={handleAddScannedProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 10 },
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, paddingHorizontal: SPACING.lg },
  scoreLabel: { color: COLORS.gray400, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  scoreValue: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  ringValue: { color: COLORS.white, fontSize: 18, fontWeight: '900' },
  ringLabel: { color: COLORS.gray400, fontSize: 9, textTransform: 'uppercase' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { flex: 1, marginRight: SPACING.md },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  macroLabel: { color: COLORS.gray400, fontSize: 11, fontWeight: '700' },
  macroValue: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  progressBarBg: { height: 6, backgroundColor: COLORS.whiteOpacity10, borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  scrollContainer: { flex: 1, marginTop: SPACING.md },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningLight, marginHorizontal: SPACING.xl, padding: SPACING.lg, borderRadius: 16, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.accent },
  suggestionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  suggestionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', marginBottom: 4 },
  suggestionText: { fontSize: 14, color: COLORS.gray500, lineHeight: 20 },
  mealsContainer: { paddingHorizontal: SPACING.xl },
  mealCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.soft, borderWidth: 1, borderColor: COLORS.gray100 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealHeaderInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mealIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  mealTitle: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  mealSubtext: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', marginTop: 2 },
  addMiniBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center' },
  foodList: { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: SPACING.sm },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  foodName: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, flex: 1, marginRight: SPACING.sm },
  foodKcal: { fontSize: 12, fontWeight: '700', color: COLORS.gray500 },
  emptyMealText: { fontSize: 11, color: COLORS.gray200, fontStyle: 'italic', marginTop: 4, marginLeft: 42 },
  createNewMealBtn: { paddingVertical: SPACING.lg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray200, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  createNewMealText: { color: COLORS.gray500, fontWeight: '700', fontSize: 14 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.default },
  fabWater: { bottom: 90, backgroundColor: COLORS.info },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  scannerTop: { alignItems: 'center' },
  scannerTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginBottom: SPACING.sm },
  scannerSubtitle: { color: COLORS.gray200, fontSize: 14 },
  scannerMiddle: { width: width * 0.7, height: width * 0.7, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 20 },
  scannerBottom: { alignItems: 'center' },
  scannerCloseBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.whiteOpacity20, justifyContent: 'center', alignItems: 'center' },
  scannerWindow: { flex: 1, borderRadius: 18, overflow: 'hidden' },
});
