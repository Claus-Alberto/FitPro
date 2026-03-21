import ALL_STRINGS from '../../../src/constants/strings.json';
const STRINGS = { ...ALL_STRINGS.diet, units: ALL_STRINGS.common.units };
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- DADOS INICIAIS ---
const INITIAL_FOOD_DATABASE = [
  {
    id: 'f1', name: STRINGS.food_names.white_rice, type: 'food',
    measurements: [{ unit: STRINGS.units.g, kcal: 1.3, protein: 0.02, carbs: 0.28, fat: 0, sodium: 1 }, { unit: STRINGS.units.spoon, kcal: 32.5, protein: 0.5, carbs: 7, fat: 0, sodium: 25 }]
  },
  {
    id: 'f2', name: STRINGS.food_names.chicken_breast, type: 'food',
    measurements: [{ unit: STRINGS.units.g, kcal: 1.65, protein: 0.31, carbs: 0, fat: 0.03, sodium: 0.7 }, { unit: STRINGS.units.filet, kcal: 165, protein: 31, carbs: 0, fat: 3, sodium: 70 }]
  },
  {
    id: 'f3', name: STRINGS.food_names.boiled_egg, type: 'food',
    measurements: [{ unit: STRINGS.units.unit, kcal: 70, protein: 6, carbs: 0.5, fat: 5, sodium: 124 }, { unit: STRINGS.units.g, kcal: 1.4, protein: 0.12, carbs: 0.01, fat: 0.1, sodium: 2.5 }]
  },
  {
    id: 'f5', name: STRINGS.food_names.whey_protein, type: 'food',
    measurements: [{ unit: STRINGS.units.scoop, kcal: 120, protein: 24, carbs: 3, fat: 1, sodium: 50 }, { unit: STRINGS.units.g, kcal: 4, protein: 0.8, carbs: 0.1, fat: 0.03, sodium: 1.6 }]
  },
];

const MOCK_SCANNED_PRODUCT = {
  id: 'scan_1',
  name: STRINGS.food_names.protein_bar,
  type: 'food',
  measurements: [
    { unit: STRINGS.units.unit, kcal: 210, protein: 18, carbs: 22, fat: 9, sodium: 80 },
    { unit: STRINGS.units.g, kcal: 4, protein: 0.35, carbs: 0.2, fat: 0.1, sodium: 1.5 }
  ]
};

const MOCK_AI_MEAL = {
  id: 'ai_1',
  name: STRINGS.food_names.ai_plate,
  type: 'food',
  measurements: [
    { unit: STRINGS.units.plate, kcal: 550, protein: 45, carbs: 60, fat: 15, sodium: 400 },
    { unit: STRINGS.units.g, kcal: 1.5, protein: 0.1, carbs: 0.15, fat: 0.04, sodium: 1.2 }
  ]
};

const INITIAL_MEALS = [
  { id: '1', title: STRINGS.meals.breakfast, time: '08:00', icon: 'coffee-outline', isDefault: true, items: [] },
  { id: '2', title: STRINGS.meals.lunch, time: '12:30', icon: 'food-drumstick-outline', isDefault: true, items: [] },
  { id: '3', title: STRINGS.meals.snack, time: '16:00', icon: 'cookie-outline', isDefault: true, items: [] },
  { id: '4', title: STRINGS.meals.dinner, time: '20:00', icon: 'food-steak', isDefault: true, items: [] }
];

const GOAL_CALORIES = 2600;

// --- COMPONENTES AUXILIARES ---
const CalorieRing = ({ size, progress, strokeWidth, color, children }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedProgress = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const safeProgress = Math.min(Math.max(progress, 0), 1);
    Animated.timing(animatedProgress, { toValue: safeProgress, duration: 1000, easing: Easing.out(Easing.exp), useNativeDriver: false }).start();
  }, [progress]);
  const strokeDashoffset = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle stroke="rgba(255,255,255,0.1)" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle stroke={color} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="none" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>{children}</View>
    </View>
  );
};

const MacroBox = ({ label, value, unit, color }: any) => (
  <View style={styles.macroBox}>
    <Text style={[styles.macroBoxValue, { color }]}>{value}<Text style={{ fontSize: 10 }}>{unit}</Text></Text>
    <Text style={styles.macroBoxLabel}>{label}</Text>
  </View>
);

const MacroBar = ({ label, current, total, color }: any) => {
  const widthAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const percentage = Math.min((current / total) * 100, 100);
    Animated.timing(widthAnim, { toValue: percentage, duration: 1000, easing: Easing.out(Easing.exp), useNativeDriver: false }).start();
  }, [current, total]);
  const widthInterpolated = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View key={label} style={styles.macroItem}>
      <View style={styles.macroHeader}><Text style={styles.macroLabel}>{label}</Text><Text style={styles.macroValue}>{Math.round(current)}/{total}g</Text></View>
      <View style={styles.progressBarBg}><Animated.View style={[styles.progressBarFill, { width: widthInterpolated, backgroundColor: color }]} /></View>
    </View>
  );
};

export default function DietScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [meals, setMeals] = useState<any[]>(INITIAL_MEALS);
  const [foodDb, setFoodDb] = useState<any[]>(INITIAL_FOOD_DATABASE);

  // Modais
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isCreationMenuOpen, setIsCreationMenuOpen] = useState(false);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isMealDetailOpen, setIsMealDetailOpen] = useState(false);

  // Scanner & IA
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isScannedModalOpen, setIsScannedModalOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [scanTargetMealId, setScanTargetMealId] = useState<string | null>(null);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // SeleÃ§Ã£o e EdiÃ§Ã£o
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [foodQuantity, setFoodQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Nova RefeiÃ§Ã£o
  const [newMealTitle, setNewMealTitle] = useState('');
  const [newMealTime, setNewMealTime] = useState('');
  const [tempDate, setTempDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditingMealTime, setIsEditingMealTime] = useState(false);

  // CriaÃ§Ã£o
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodKcal, setCustomFoodKcal] = useState('');
  const [customFoodProt, setCustomFoodProt] = useState('');
  const [customFoodCarb, setCustomFoodCarb] = useState('');
  const [customFoodFat, setCustomFoodFat] = useState('');

  const [recipeName, setRecipeName] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [recipeStepsList, setRecipeStepsList] = useState<string[]>([]);
  const [currentStepText, setCurrentStepText] = useState('');
  const [recipeServings, setRecipeServings] = useState('1');
  const [isSelectingIngredient, setIsSelectingIngredient] = useState(false);

  // Water Tracker
  const [waterCurrent, setWaterCurrent] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [waterInput, setWaterInput] = useState('250');
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [isEditingWaterGoal, setIsEditingWaterGoal] = useState(false);
  const [tempWaterGoal, setTempWaterGoal] = useState('2000');

  const currentMeal = useMemo(() => meals.find(m => m.id === selectedMealId), [meals, selectedMealId]);

  const dailyTotals = useMemo(() => {
    return meals.reduce((acc, meal) => {
      meal.items.forEach((item: any) => {
        acc.kcal += item.kcal || 0;
        acc.p += item.protein || 0;
        acc.c += item.carbs || 0;
        acc.f += item.fat || 0;
      });
      return acc;
    }, { kcal: 0, p: 0, c: 0, f: 0 });
  }, [meals]);

  const remainingCalories = GOAL_CALORIES - dailyTotals.kcal;
  const caloriesProgress = dailyTotals.kcal / GOAL_CALORIES;

  const recipeTotals = useMemo(() => {
    const servings = parseFloat(recipeServings) || 1;
    const totals = recipeIngredients.reduce((acc, item) => ({
      kcal: acc.kcal + item.calculatedKcal,
      p: acc.p + item.calculatedP,
      c: acc.c + item.calculatedC,
      f: acc.f + item.calculatedF,
    }), { kcal: 0, p: 0, c: 0, f: 0 });

    return {
      perServingKcal: Math.round(totals.kcal / servings),
      p: Math.round(totals.p / servings),
      c: Math.round(totals.c / servings),
      f: Math.round(totals.f / servings),
    };
  }, [recipeIngredients, recipeServings]);

  const currentMacros = useMemo(() => {
    if (!selectedUnit || !foodQuantity) return { kcal: 0, p: 0, c: 0, f: 0, na: 0 };
    const qty = parseFloat(foodQuantity.replace(',', '.'));
    if (isNaN(qty)) return { kcal: 0, p: 0, c: 0, f: 0, na: 0 };
    return {
      kcal: Math.round(qty * selectedUnit.kcal),
      p: Math.round(qty * (selectedUnit.protein || 0)),
      c: Math.round(qty * (selectedUnit.carbs || 0)),
      f: Math.round(qty * (selectedUnit.fat || 0)),
      na: Math.round(qty * (selectedUnit.sodium || 0)),
    };
  }, [selectedUnit, foodQuantity]);

  // --- ACTIONS ---

  const handleTakeMealPhoto = async () => {
    setIsCreationMenuOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
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
      setIsPhotoModalOpen(true);
    }
  };

  const handleAnalyzePhoto = () => {
    if (!photoUri) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsPhotoModalOpen(false);
      if (!selectedMealId) {
        const bestId = findClosestMealId();
        setSelectedMealId(bestId);
      }
      handleSelectFood(MOCK_AI_MEAL);
      setPhotoUri(null);
      setPhotoDescription('');
    }, 2500);
  };

  const handleClearItems = () => { if (!selectedMealId) return; Alert.alert(STRINGS.alerts.clearMealTitle, STRINGS.alerts.clearMealMsg, [{ text: STRINGS.alerts.cancel, style: "cancel" }, { text: STRINGS.alerts.clear, onPress: () => { const updated = meals.map(m => m.id === selectedMealId ? { ...m, items: [] } : m); setMeals(updated); } }]); };
  const handleDeleteMeal = () => { if (!currentMeal) return; const message = currentMeal.isDefault ? `"${currentMeal.title}" ${STRINGS.alerts.deleteMealMsgDefault}` : STRINGS.alerts.deleteMealMsgCustom; Alert.alert(STRINGS.alerts.deleteMealTitle, message, [{ text: STRINGS.alerts.cancel, style: "cancel" }, { text: STRINGS.alerts.delete, style: "destructive", onPress: () => { const updated = meals.filter(m => m.id !== selectedMealId); setMeals(updated); setIsMealDetailOpen(false); } }]); };
  const findClosestMealId = () => { const now = new Date(); const currentMinutes = now.getHours() * 60 + now.getMinutes(); let closestId = meals[0].id; let minDiff = Infinity; meals.forEach(meal => { const [h, m] = meal.time.split(':').map(Number); const mealMinutes = h * 60 + m; const diff = Math.abs(mealMinutes - currentMinutes); if (diff < minDiff) { minDiff = diff; closestId = meal.id; } }); return closestId; };
  const openScanner = () => { if (!permission) return; if (!permission.granted) { requestPermission(); return; } setScanned(false); setIsScannerOpen(true); };
  const handleBarCodeScanned = ({ type, data }: any) => { setScanned(true); setIsScannerOpen(false); setScannedProduct(MOCK_SCANNED_PRODUCT); const bestMealId = findClosestMealId(); setScanTargetMealId(bestMealId); setIsScannedModalOpen(true); };
  const handleAddScannedProduct = () => { setIsScannedModalOpen(false); setSelectedMealId(scanTargetMealId); handleSelectFood(scannedProduct); };
  function handleAddStep() { if (!currentStepText.trim()) return; setRecipeStepsList([...recipeStepsList, currentStepText]); setCurrentStepText(''); }
  function handleRemoveStep(index: number) { const l = [...recipeStepsList]; l.splice(index, 1); setRecipeStepsList(l); }

  const filteredFoods = useMemo(() => {
    if (!searchText) return foodDb;
    return foodDb.filter(f => f.name.toLowerCase().includes(searchText.toLowerCase()));
  }, [foodDb, searchText]);

  function handleCreateMeal() {
    if (!newMealTitle) return Alert.alert(STRINGS.alerts.error, STRINGS.modals.newMeal.errorName);
    const time = newMealTime || "00:00";
    const newMeal = { id: Math.random().toString(), title: newMealTitle, time, icon: 'food-apple-outline', isDefault: false, items: [] };
    const updated = [...meals, newMeal].sort((a, b) => a.time.localeCompare(b.time));
    setMeals(updated);
    setNewMealTitle('');
    setNewMealTime('');
    setIsMealModalOpen(false);
  }

  function handleSaveCustomFood() {
    if (!customFoodName) return Alert.alert(STRINGS.alerts.error, STRINGS.modals.customFood.errorName);
    const k = parseFloat(customFoodKcal) || 0;
    const p = parseFloat(customFoodProt) || 0;
    const c = parseFloat(customFoodCarb) || 0;
    const f = parseFloat(customFoodFat) || 0;
    const newFood = {
      id: Math.random().toString(),
      name: customFoodName,
      type: 'food',
      measurements: [
        { unit: STRINGS.units.g, kcal: k / 100, protein: p / 100, carbs: c / 100, fat: f / 100, sodium: 0 },
        { unit: STRINGS.units.serving, kcal: k, protein: p, carbs: c, fat: f, sodium: 0 }
      ]
    };
    setFoodDb([...foodDb, newFood]);
    setIsCustomFoodModalOpen(false);
    setCustomFoodName(''); setCustomFoodKcal(''); setCustomFoodProt(''); setCustomFoodCarb(''); setCustomFoodFat('');
    Alert.alert(STRINGS.alerts.success, STRINGS.modals.customFood.success);
  }

  function startAddIngredient() {
    setIsSelectingIngredient(true);
    setIsRecipeModalOpen(false);
    setIsFoodModalOpen(true);
  }

  function handleSaveRecipe() {
    if (!recipeName) return Alert.alert(STRINGS.alerts.error, STRINGS.modals.recipe.errorName);
    if (recipeIngredients.length === 0) return Alert.alert(STRINGS.alerts.error, STRINGS.modals.recipe.errorIngredients);
    const newRecipe = {
      id: Math.random().toString(),
      name: recipeName,
      type: 'recipe',
      measurements: [{
        unit: STRINGS.units.serving,
        kcal: recipeTotals.perServingKcal,
        protein: recipeTotals.p,
        carbs: recipeTotals.c,
        fat: recipeTotals.f,
        sodium: 0
      }]
    };
    setFoodDb([...foodDb, newRecipe]);
    setIsRecipeModalOpen(false);
    setRecipeName(''); setRecipeDesc(''); setRecipeIngredients([]); setRecipeStepsList([]);
    Alert.alert(STRINGS.alerts.success, STRINGS.modals.recipe.success);
  }

  function handleOpenCreationMenu() { setIsCreationMenuOpen(true); }
  function openMealDetail(mealId: string) { setSelectedMealId(mealId); setIsMealDetailOpen(true); }
  function handleEditItem(item: any) {
    // Tenta recuperar o alimento original para ter todas as opções de medida
    let originalFood = foodDb.find(f => f.name === item.foodName);

    // Se não encontrar (ex: item escaneado ou removido), cria um objeto temporário
    if (!originalFood) {
      originalFood = {
        id: item.id,
        name: item.foodName,
        type: 'food',
        measurements: [item.measureUnit]
      };
    }

    setEditingItem(item);
    setSelectedFood(originalFood);
    setSelectedUnit(item.measureUnit);
    setFoodQuantity(item.qty.toString());

    setIsMealDetailOpen(false);
    setIsQuantityModalOpen(true);
  }

  function handleRemoveItem(itemId: string) {
    if (!selectedMealId) return;
    const updated = meals.map(m => {
      if (m.id === selectedMealId) {
        return { ...m, items: m.items.filter((i: any) => i.id !== itemId) };
      }
      return m;
    });
    setMeals(updated);
  }

  function handleWater() {
    setIsWaterModalOpen(true);
  }

  function adjustWaterInput(amount: number) {
    const current = parseInt(waterInput) || 0;
    const newValue = Math.max(0, current + amount);
    setWaterInput(newValue.toString());
  }

  function handleAddWater() {
    const amount = parseInt(waterInput) || 0;
    if (amount > 0) {
      setWaterCurrent(prev => prev + amount);
      Alert.alert(STRINGS.modals.water.title, `${STRINGS.modals.water.addedAlert} ${amount}ml!`);
    }
  }

  function handleUpdateWaterGoal() {
    const newGoal = parseInt(tempWaterGoal) || 2000;
    setWaterGoal(newGoal);
    setIsEditingWaterGoal(false);
  }

  function handleSelectFood(food: any) {
    if (!food || !food.measurements || food.measurements.length === 0) {
      Alert.alert(STRINGS.alerts.error, STRINGS.alerts.invalidFood);
      return;
    }
    setSelectedFood(food);
    setSelectedUnit(food.measurements[0]);
    setFoodQuantity('');
    if (!editingItem) setEditingItem(null);
    setIsQuantityModalOpen(true);
  }

  function handleConfirmAddFood() { const qty = parseFloat(foodQuantity.replace(',', '.')); if (isNaN(qty) || qty <= 0) return Alert.alert(STRINGS.alerts.error, STRINGS.modals.quantity.errorQty); if (!selectedUnit) return Alert.alert(STRINGS.alerts.error, STRINGS.modals.quantity.errorUnit); const calculatedValues = { kcal: Math.round(qty * selectedUnit.kcal), p: Math.round(qty * (selectedUnit.protein || 0)), c: Math.round(qty * (selectedUnit.carbs || 0)), f: Math.round(qty * (selectedUnit.fat || 0)) }; if (isSelectingIngredient) { const ingredient = { ...selectedFood, qty, measureUnit: selectedUnit, calculatedKcal: calculatedValues.kcal, calculatedP: calculatedValues.p, calculatedC: calculatedValues.c, calculatedF: calculatedValues.f }; setRecipeIngredients([...recipeIngredients, ingredient]); setIsQuantityModalOpen(false); setIsFoodModalOpen(false); setIsSelectingIngredient(false); setIsRecipeModalOpen(true); return; } if (!selectedMealId) return Alert.alert(STRINGS.alerts.error, STRINGS.modals.quantity.errorMeal); const newItemData = { id: editingItem ? editingItem.id : Math.random().toString(), foodName: selectedFood.name, displayName: `${selectedFood.name} (${qty}${selectedUnit.unit})`, qty, measureUnit: selectedUnit, kcal: calculatedValues.kcal, protein: calculatedValues.p, carbs: calculatedValues.c, fat: calculatedValues.f }; const updatedMeals = meals.map(meal => { if (meal.id === selectedMealId) { let newItems; if (editingItem) { newItems = meal.items.map((i: any) => i.id === editingItem.id ? newItemData : i); } else { newItems = [...meal.items, newItemData]; } return { ...meal, items: newItems }; } return meal; }); setMeals(updatedMeals); setIsQuantityModalOpen(false); setIsFoodModalOpen(false); setEditingItem(null); setSelectedFood(null); setFoodQuantity(''); }

  function openFoodSearch(mealId: string) { setSelectedMealId(mealId); setIsSelectingIngredient(false); setEditingItem(null); setSearchText(''); setIsFoodModalOpen(true); }

  function onChangeTime(e: any, d?: Date) { if (Platform.OS === 'android') setShowTimePicker(false); if (d) { const h = d.getHours().toString().padStart(2, '0'); const m = d.getMinutes().toString().padStart(2, '0'); const timeString = `${h}:${m}`; if (isEditingMealTime && selectedMealId) { const updatedMeals = meals.map(meal => meal.id === selectedMealId ? { ...meal, time: timeString } : meal).sort((a, b) => a.time.localeCompare(b.time)); setMeals(updatedMeals); } else { setNewMealTime(timeString); } } setIsEditingMealTime(false); }

  function handleEditMealTime() { setIsEditingMealTime(true); setShowTimePicker(true); }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#191511" />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.scoreBoard}>
          <View>
            <Text style={styles.scoreLabel}>{STRINGS.header.todayGoals}</Text>
            <Text style={styles.scoreValue}>{Math.round(caloriesProgress * 100)}%</Text>
          </View>
          <CalorieRing size={100} progress={caloriesProgress} strokeWidth={8} color="#008E00">
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.ringValue}>{remainingCalories}</Text>
              <Text style={styles.ringLabel}>{STRINGS.header.kcal}</Text>
            </View>
          </CalorieRing>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.scoreLabel}>{STRINGS.header.consumed}</Text>
            <Text style={styles.scoreValue}>{Math.round(dailyTotals.kcal)}</Text>
          </View>
        </View>
        <View style={styles.macroRow}>
          <MacroBar label={STRINGS.header.protein} current={dailyTotals.p} total={180} color="#008E00" />
          <MacroBar label={STRINGS.header.carbs} current={dailyTotals.c} total={300} color="#3B82F6" />
          <MacroBar label={STRINGS.header.fat} current={dailyTotals.f} total={80} color="#F59E0B" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionIcon}><MaterialCommunityIcons name="chef-hat" size={24} color="#F59E0B" /></View>
          <View style={{ flex: 1 }}><Text style={styles.suggestionTitle}>{STRINGS.suggestion.title}</Text><Text style={styles.suggestionText}>{STRINGS.suggestion.missingProtein} <Text style={{ fontWeight: '700', color: '#008E00' }}>{Math.max(0, 180 - dailyTotals.p)}{STRINGS.suggestion.proteinSuffix}</Text>.</Text></View>
        </View>

        <View style={styles.mealsContainer}>
          {meals.map((meal) => (
            <TouchableOpacity key={meal.id} style={styles.mealCard} onPress={() => openMealDetail(meal.id)} activeOpacity={0.9}>
              <View style={styles.mealHeader}>
                <View style={styles.mealHeaderInfo}>
                  <View style={styles.mealIconBg}><MaterialCommunityIcons name={meal.icon as any} size={18} color="#191511" /></View>
                  <View><Text style={styles.mealTitle}>{meal.title}</Text><Text style={styles.mealSubtext}>{meal.time} â€¢ <Text style={{ color: '#008E00', fontWeight: '700' }}>{Math.round(meal.items.reduce((acc: any, i: any) => acc + i.kcal, 0))} kcal</Text></Text></View>
                </View>
                <TouchableOpacity style={styles.addMiniBtn} onPress={() => openFoodSearch(meal.id)}><MaterialCommunityIcons name="plus" size={20} color="#008E00" /></TouchableOpacity>
              </View>
              {meal.items.length > 0 && (<View style={styles.foodList}>{meal.items.map((food: any, idx: number) => (<View key={idx} style={styles.foodItem}><Text style={styles.foodName} numberOfLines={1}>{food.displayName || food.name}</Text><Text style={styles.foodKcal}>{Math.round(food.kcal)}</Text></View>))}</View>)}
              {meal.items.length === 0 && (<Text style={styles.emptyMealText}>{STRINGS.meals.empty}</Text>)}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.createNewMealBtn} onPress={() => setIsMealModalOpen(true)}><Text style={styles.createNewMealText}>+ Criar RefeiÃ§Ã£o Extra</Text></TouchableOpacity>
        </View>
      </ScrollView >

      <TouchableOpacity style={[styles.fab, { bottom: 90, backgroundColor: '#3B82F6' }]} onPress={handleWater}>
        <MaterialCommunityIcons name="water" size={28} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} onPress={openScanner}><MaterialCommunityIcons name="barcode-scan" size={28} color="#FFF" /></TouchableOpacity>

      {/* --- MODAL ÁGUA --- */}
      <Modal visible={isWaterModalOpen} transparent={true} animationType="slide" statusBarTranslucent onRequestClose={() => setIsWaterModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsWaterModalOpen(false)} />
          <View style={[styles.detailModalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{STRINGS.modals.water.title}</Text>
              <TouchableOpacity onPress={() => setIsWaterModalOpen(false)} style={styles.closeIconBg}>
                <MaterialCommunityIcons name="close" size={24} color="#191511" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 30 }}>
              <View style={{ width: 200, height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <CalorieRing size={180} progress={waterCurrent / waterGoal} strokeWidth={15} color="#3B82F6">
                  <View style={{ alignItems: 'center' }}>
                    <MaterialCommunityIcons name="water" size={40} color="#3B82F6" style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 32, fontWeight: '800', color: '#191511' }}>{waterCurrent}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600' }}>{STRINGS.modals.water.goal} {waterGoal}{STRINGS.modals.water.unit}</Text>
                      <TouchableOpacity onPress={() => { setTempWaterGoal(waterGoal.toString()); setIsEditingWaterGoal(true); }}>
                        <MaterialCommunityIcons name="pencil" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </CalorieRing>
              </View>
            </View>

            {isEditingWaterGoal ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, textAlign: 'center' }]}
                  value={tempWaterGoal}
                  onChangeText={setTempWaterGoal}
                  keyboardType="numeric"
                  autoFocus
                />
                <TouchableOpacity style={[styles.saveBtn, { marginTop: 0, width: 100 }]} onPress={handleUpdateWaterGoal}>
                  <Text style={styles.saveBtnText}>{STRINGS.modals.water.save}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
                  <TouchableOpacity
                    style={styles.waterControlBtn}
                    onPress={() => adjustWaterInput(-250)}
                  >
                    <MaterialCommunityIcons name="minus" size={24} color="#3B82F6" />
                  </TouchableOpacity>

                  <View style={{ alignItems: 'center', width: 100 }}>
                    <TextInput
                      style={styles.waterInput}
                      value={waterInput}
                      onChangeText={setWaterInput}
                      keyboardType="numeric"
                    />
                    <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>{STRINGS.modals.water.unit}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.waterControlBtn}
                    onPress={() => adjustWaterInput(250)}
                  >
                    <MaterialCommunityIcons name="plus" size={24} color="#3B82F6" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#3B82F6' }]} onPress={handleAddWater}>
                  <Text style={styles.saveBtnText}>{STRINGS.modals.water.add}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* --- MODAL FOTO DO PRATO --- */}
      <Modal visible={isPhotoModalOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsPhotoModalOpen(false)}>
        <View style={[styles.foodModalContainer, { paddingTop: insets.top }]}>
          <View style={styles.foodModalHeader}>
            <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}><MaterialCommunityIcons name="close" size={28} color="#191511" /></TouchableOpacity>
            <Text style={styles.foodModalTitle}>{STRINGS.modals.photo.title}</Text>
            <View style={{ width: 30 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
            <View style={styles.photoPreviewContainer}>
              {photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreview} />}
            </View>
            <Text style={[styles.inputLabel, { alignSelf: 'flex-start' }]}>{STRINGS.modals.photo.label}</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top', width: '100%' }]}
              multiline
              placeholder={STRINGS.modals.photo.placeholder}
              value={photoDescription}
              onChangeText={setPhotoDescription}
            />
            {/* BOTÃƒO AGORA VERDE */}
            <TouchableOpacity
              style={[styles.analyzeBtn, isAnalyzing && { opacity: 0.7 }]}
              onPress={handleAnalyzePhoto}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (<ActivityIndicator color="#FFF" />) : (<><MaterialCommunityIcons name="creation" size={24} color="#FFF" /><Text style={styles.analyzeBtnText}>{STRINGS.modals.photo.analyzeBtn}</Text></>)}
            </TouchableOpacity>
            {isAnalyzing && <Text style={{ marginTop: 16, color: '#6B7280' }}>{STRINGS.modals.photo.analyzing}</Text>}
          </ScrollView>
        </View>
      </Modal>

      {/* OUTROS MODAIS (MANTIDOS) */}
      <Modal visible={isMealDetailOpen} transparent={true} animationType="slide" statusBarTranslucent onRequestClose={() => setIsMealDetailOpen(false)}><View style={styles.modalBackdrop}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsMealDetailOpen(false)} /><View style={[styles.detailModalContent, { paddingBottom: insets.bottom + 20 }]}><View style={styles.detailHeader}><View><Text style={styles.detailTitle}>{currentMeal?.title}</Text><Text style={styles.detailSubtitle}>{currentMeal?.time} â€¢ {currentMeal ? Math.round(currentMeal.items.reduce((acc: any, i: any) => acc + i.kcal, 0)) : 0} kcal</Text></View><TouchableOpacity onPress={() => setIsMealDetailOpen(false)} style={styles.closeIconBg}><MaterialCommunityIcons name="close" size={24} color="#191511" /></TouchableOpacity></View><ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>{currentMeal?.items.map((item: any) => (<View key={item.id} style={styles.detailItemRow}><View style={{ flex: 1 }}><Text style={styles.detailItemName}>{item.displayName || item.name}</Text><Text style={styles.detailItemKcal}>{Math.round(item.kcal)} kcal</Text></View><View style={{ flexDirection: 'row', gap: 12 }}><TouchableOpacity onPress={() => handleEditItem(item)} style={styles.actionBtn}><MaterialCommunityIcons name="pencil" size={20} color="#008E00" /></TouchableOpacity><TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}><MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" /></TouchableOpacity></View></View>))}{currentMeal?.items.length === 0 && <Text style={styles.emptyListText}>{STRINGS.meals.emptyList}</Text>}</ScrollView><TouchableOpacity style={styles.addFoodLargeBtn} onPress={() => { setIsMealDetailOpen(false); openFoodSearch(currentMeal!.id); }}><MaterialCommunityIcons name="plus" size={20} color="#FFF" /><Text style={styles.addFoodLargeText}>{STRINGS.modals.foodSearch.titleAdd}</Text></TouchableOpacity><View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}><TouchableOpacity style={[styles.deleteMealBtn, { backgroundColor: '#FFF7ED', flex: 1 }]} onPress={handleClearItems}><Text style={[styles.deleteMealText, { color: '#F59E0B' }]}>{STRINGS.meals.clearItems}</Text></TouchableOpacity><TouchableOpacity style={[styles.deleteMealBtn, { flex: 1 }]} onPress={handleDeleteMeal}><Text style={styles.deleteMealText}>{STRINGS.meals.deleteMeal}</Text></TouchableOpacity></View></View></View></Modal>
      <Modal visible={isScannedModalOpen} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setIsScannedModalOpen(false)}><View style={styles.modalBackdrop}><View style={[styles.detailModalContent, { padding: 30, alignItems: 'center' }]}><View style={styles.scanSuccessIcon}><MaterialCommunityIcons name="check" size={40} color="#FFF" /></View><Text style={styles.scanTitle}>{STRINGS.modals.scanner.foundTitle}</Text><View style={styles.scannedProductCard}><Text style={styles.scannedProductName}>{scannedProduct?.name}</Text><View style={[styles.macroGrid, { marginBottom: 0, marginTop: 16 }]}><MacroBox label="KCAL" value={scannedProduct?.measurements[0].kcal} unit="" color="#6B7280" /><MacroBox label="PROT" value={scannedProduct?.measurements[0].protein} unit="g" color="#008E00" /><MacroBox label="CARB" value={scannedProduct?.measurements[0].carbs} unit="g" color="#3B82F6" /><MacroBox label="GORD" value={scannedProduct?.measurements[0].fat} unit="g" color="#F59E0B" /></View></View><View style={{ width: '100%', marginBottom: 20 }}><Text style={styles.inputLabel}>{STRINGS.modals.scanner.addIn}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>{meals.map(m => { const isSelected = scanTargetMealId === m.id; return (<TouchableOpacity key={m.id} style={[styles.targetMealPill, isSelected && styles.targetMealPillActive]} onPress={() => setScanTargetMealId(m.id)}><Text style={[styles.targetMealText, isSelected && styles.targetMealTextActive]}>{m.title}</Text>{isSelected && <MaterialCommunityIcons name="check-circle" size={16} color="#008E00" style={{ marginLeft: 4 }} />}</TouchableOpacity>) })}</ScrollView></View><View style={{ width: '100%', gap: 12 }}><TouchableOpacity style={styles.confirmScanBtn} onPress={handleAddScannedProduct}><Text style={styles.confirmScanText}>{STRINGS.modals.scanner.confirm}</Text><MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" /></TouchableOpacity><TouchableOpacity style={styles.cancelScanBtn} onPress={() => setIsScannedModalOpen(false)}><Text style={styles.cancelScanText}>{STRINGS.modals.scanner.cancel}</Text></TouchableOpacity></View></View></View></Modal>
      <Modal visible={isScannerOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsScannerOpen(false)}><View style={styles.scannerContainer}><CameraView style={StyleSheet.absoluteFill} facing="back" onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8"], }} /><View style={styles.scannerOverlay}><View style={styles.scannerTop}><Text style={styles.scannerTitle}>{STRINGS.modals.scanner.title}</Text><Text style={styles.scannerSubtitle}>{STRINGS.modals.scanner.subtitle}</Text></View><View style={styles.scannerMiddle}><View style={styles.scannerWindow} /></View><View style={styles.scannerBottom}><TouchableOpacity style={styles.scannerCloseBtn} onPress={() => setIsScannerOpen(false)}><MaterialCommunityIcons name="close" size={32} color="#FFF" /></TouchableOpacity></View></View></View></Modal>
      <Modal visible={isCreationMenuOpen} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setIsCreationMenuOpen(false)}><TouchableOpacity style={styles.modalBackdropLayer} onPress={() => setIsCreationMenuOpen(false)} activeOpacity={1}><View style={styles.creationMenuCard}><Text style={styles.creationMenuTitle}>{STRINGS.modals.creation.title}</Text><TouchableOpacity style={styles.creationOption} onPress={handleTakeMealPhoto}><View style={[styles.creationIcon, { backgroundColor: '#F3E8FF' }]}><MaterialCommunityIcons name="camera-iris" size={24} color="#9333EA" /></View><View><Text style={styles.creationOptionTitle}>{STRINGS.modals.creation.photoTitle}</Text><Text style={styles.creationOptionSub}>{STRINGS.modals.creation.photoSub}</Text></View></TouchableOpacity><TouchableOpacity style={styles.creationOption} onPress={() => { setIsCreationMenuOpen(false); setIsCustomFoodModalOpen(true); }}><View style={[styles.creationIcon, { backgroundColor: '#F0FDF4' }]}><MaterialCommunityIcons name="food-apple" size={24} color="#008E00" /></View><View><Text style={styles.creationOptionTitle}>{STRINGS.modals.creation.foodTitle}</Text><Text style={styles.creationOptionSub}>{STRINGS.modals.creation.foodSub}</Text></View></TouchableOpacity><TouchableOpacity style={styles.creationOption} onPress={() => { setIsCreationMenuOpen(false); setIsRecipeModalOpen(true); }}><View style={[styles.creationIcon, { backgroundColor: '#FFF7ED' }]}><MaterialCommunityIcons name="chef-hat" size={24} color="#F59E0B" /></View><View><Text style={styles.creationOptionTitle}>{STRINGS.modals.creation.recipeTitle}</Text><Text style={styles.creationOptionSub}>{STRINGS.modals.creation.recipeSub}</Text></View></TouchableOpacity></View></TouchableOpacity></Modal>
      <Modal visible={isRecipeModalOpen} animationType="slide" statusBarTranslucent onRequestClose={() => setIsRecipeModalOpen(false)}><View style={[styles.foodModalContainer, { paddingTop: insets.top }]}><View style={styles.foodModalHeader}><TouchableOpacity onPress={() => setIsRecipeModalOpen(false)}><MaterialCommunityIcons name="close" size={28} color="#191511" /></TouchableOpacity><Text style={styles.foodModalTitle}>{STRINGS.modals.recipe.title}</Text><TouchableOpacity onPress={handleSaveRecipe}><Text style={{ color: '#008E00', fontWeight: '800' }}>{STRINGS.modals.recipe.save}</Text></TouchableOpacity></View><ScrollView contentContainerStyle={{ padding: 20 }}><View style={styles.recipeTotalsCard}><Text style={styles.recipeTotalsTitle}>{STRINGS.modals.recipe.perServing} ({recipeServings} {STRINGS.modals.recipe.yield})</Text><View style={styles.recipeTotalsRow}><View style={{ alignItems: 'center' }}><Text style={styles.rtVal}>{recipeTotals.perServingKcal}</Text><Text style={styles.rtLab}>kcal</Text></View><View style={{ alignItems: 'center' }}><Text style={styles.rtVal}>{recipeTotals.p}g</Text><Text style={styles.rtLab}>Prot</Text></View><View style={{ alignItems: 'center' }}><Text style={styles.rtVal}>{recipeTotals.c}g</Text><Text style={styles.rtLab}>Carb</Text></View><View style={{ alignItems: 'center' }}><Text style={styles.rtVal}>{recipeTotals.f}g</Text><Text style={styles.rtLab}>Gord</Text></View></View></View><Text style={styles.inputLabel}>{STRINGS.modals.recipe.nameLabel}</Text><TextInput style={styles.input} placeholder={STRINGS.modals.recipe.namePlaceholder} value={recipeName} onChangeText={setRecipeName} /><Text style={styles.inputLabel}>{STRINGS.modals.recipe.descLabel}</Text><TextInput style={styles.input} placeholder={STRINGS.modals.recipe.descPlaceholder} value={recipeDesc} onChangeText={setRecipeDesc} /><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><Text style={styles.inputLabel}>{STRINGS.modals.recipe.ingredientsLabel}</Text><TouchableOpacity onPress={startAddIngredient} style={{ flexDirection: 'row', alignItems: 'center' }}><MaterialCommunityIcons name="plus" size={16} color="#008E00" /><Text style={{ color: '#008E00', fontWeight: '700' }}>{STRINGS.modals.recipe.addIngredient}</Text></TouchableOpacity></View>{recipeIngredients.map((ing, idx) => (<View key={idx} style={styles.recipeIngredientRow}><Text style={{ flex: 1, fontWeight: '600', color: '#191511' }}>{ing.qty}{ing.measureUnit.unit} {ing.name}</Text><Text style={{ color: '#6B7280' }}>{Math.round(ing.calculatedKcal)} kcal</Text></View>))}{recipeIngredients.length === 0 && <Text style={styles.emptyMealText}>{STRINGS.modals.recipe.emptyIngredients}</Text>}<Text style={[styles.inputLabel, { marginTop: 20 }]}>{STRINGS.modals.recipe.stepsLabel}</Text><View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}><TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder={STRINGS.modals.recipe.stepsPlaceholder} value={currentStepText} onChangeText={setCurrentStepText} /><TouchableOpacity onPress={handleAddStep} style={styles.addStepBtn}><MaterialCommunityIcons name="arrow-up" size={24} color="#FFF" /></TouchableOpacity></View>{recipeStepsList.map((step, idx) => (<View key={idx} style={styles.stepItem}><View style={styles.stepCircle}><Text style={styles.stepNumber}>{idx + 1}</Text></View><Text style={styles.stepText}>{step}</Text><TouchableOpacity onPress={() => handleRemoveStep(idx)}><MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" /></TouchableOpacity></View>))}<Text style={[styles.inputLabel, { marginTop: 20 }]}>{STRINGS.modals.recipe.yieldLabel}</Text><TextInput style={styles.input} keyboardType="numeric" value={recipeServings} onChangeText={setRecipeServings} /></ScrollView></View></Modal>
      <Modal visible={isCustomFoodModalOpen} transparent={true} animationType="slide" statusBarTranslucent onRequestClose={() => setIsCustomFoodModalOpen(false)}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={styles.modalKeyboardContainer}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsCustomFoodModalOpen(false)} activeOpacity={1}><View style={styles.modalBackdropLayer} /></TouchableOpacity><View style={styles.modalContent}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{STRINGS.modals.customFood.title}</Text><TouchableOpacity onPress={() => setIsCustomFoodModalOpen(false)}><MaterialCommunityIcons name="close" size={24} color="#6B7280" /></TouchableOpacity></View><ScrollView showsVerticalScrollIndicator={false}><Text style={styles.inputLabel}>{STRINGS.modals.customFood.nameLabel}</Text><TextInput style={styles.input} placeholder={STRINGS.modals.customFood.namePlaceholder} value={customFoodName} onChangeText={setCustomFoodName} /><Text style={styles.inputLabel}>{STRINGS.modals.customFood.kcalLabel}</Text><TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={customFoodKcal} onChangeText={setCustomFoodKcal} /><View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Text style={styles.inputLabel}>{STRINGS.modals.customFood.protLabel}</Text><TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={customFoodProt} onChangeText={setCustomFoodProt} /></View><View style={{ flex: 1 }}><Text style={styles.inputLabel}>{STRINGS.modals.customFood.carbLabel}</Text><TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={customFoodCarb} onChangeText={setCustomFoodCarb} /></View><View style={{ flex: 1 }}><Text style={styles.inputLabel}>{STRINGS.modals.customFood.fatLabel}</Text><TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={customFoodFat} onChangeText={setCustomFoodFat} /></View></View><TouchableOpacity style={styles.saveBtn} onPress={handleSaveCustomFood}><Text style={styles.saveBtnText}>{STRINGS.modals.customFood.save}</Text></TouchableOpacity></ScrollView></View></KeyboardAvoidingView></Modal>
      <Modal visible={isFoodModalOpen} transparent={true} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setIsFoodModalOpen(false)}><View style={styles.foodModalContainer}><View style={[styles.foodModalContent, { paddingTop: insets.top + 20 }]}><View style={styles.foodModalHeader}><TouchableOpacity onPress={() => { setIsFoodModalOpen(false); if (isSelectingIngredient) setIsRecipeModalOpen(true); }} style={styles.backBtn}><MaterialCommunityIcons name="chevron-down" size={30} color="#191511" /></TouchableOpacity><Text style={styles.foodModalTitle}>{isSelectingIngredient ? STRINGS.modals.foodSearch.titleIngredient : STRINGS.modals.foodSearch.titleAdd}</Text><TouchableOpacity style={styles.backBtn} onPress={handleOpenCreationMenu}><MaterialCommunityIcons name="plus" size={28} color="#008E00" /></TouchableOpacity></View><View style={styles.searchBar}><MaterialCommunityIcons name="magnify" size={24} color="#9CA3AF" /><TextInput style={styles.searchInput} placeholder={STRINGS.modals.foodSearch.placeholder} placeholderTextColor="#9CA3AF" value={searchText} onChangeText={setSearchText} autoFocus={true} /></View><FlatList data={filteredFoods} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" renderItem={({ item }) => (<TouchableOpacity style={styles.foodResultItem} onPress={() => handleSelectFood(item)}><View style={{ flex: 1 }}><Text style={styles.foodResultName}>{item.name}</Text><Text style={styles.foodResultMacros}>{item.type === 'recipe' ? STRINGS.modals.foodSearch.homemade : Math.round(item.measurements[0].kcal) + ' kcal'}</Text></View><MaterialCommunityIcons name="plus-circle" size={24} color="#008E00" /></TouchableOpacity>)} /></View></View></Modal>
      <Modal visible={isQuantityModalOpen} transparent={true} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setIsQuantityModalOpen(false)}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={styles.modalKeyboardContainer}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsQuantityModalOpen(false)} activeOpacity={1}><View style={styles.modalBackdropLayer} /></TouchableOpacity><View style={styles.modalContent}><View style={{ alignItems: 'center', marginBottom: 20 }}><Text style={styles.modalTitle}>{selectedFood?.name}</Text><Text style={{ color: '#9CA3AF', fontSize: 14 }}>{STRINGS.modals.quantity.select}</Text></View><View style={styles.unitSelectorContainer}>{selectedFood?.measurements?.map((measure: any, index: number) => { const isSelected = selectedUnit?.unit === measure.unit; return (<TouchableOpacity key={index} style={[styles.unitPill, isSelected && styles.unitPillActive]} onPress={() => setSelectedUnit(measure)}><Text style={[styles.unitPillText, isSelected && styles.unitPillTextActive]}>{measure.unit}</Text></TouchableOpacity>); })}</View><View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 12 }}><TextInput style={styles.bigInput} value={foodQuantity} onChangeText={setFoodQuantity} keyboardType="numeric" autoFocus={true} placeholder="0" placeholderTextColor="#E5E7EB" /><Text style={styles.bigUnit}>{selectedUnit?.unit}</Text></View><View style={styles.macroGrid}><MacroBox label={STRINGS.macros_short.kcal} value={currentMacros.kcal} unit="kcal" color="#6B7280" /><MacroBox label={STRINGS.macros_short.protein} value={currentMacros.p} unit="g" color="#008E00" /><MacroBox label={STRINGS.macros_short.carbs} value={currentMacros.c} unit="g" color="#3B82F6" /><MacroBox label={STRINGS.macros_short.fat} value={currentMacros.f} unit="g" color="#F59E0B" /></View><TouchableOpacity style={styles.saveBtn} onPress={handleConfirmAddFood}><Text style={styles.saveBtnText}>{editingItem ? STRINGS.modals.quantity.update : (isSelectingIngredient ? STRINGS.modals.quantity.addIngredient : STRINGS.modals.quantity.add)}</Text></TouchableOpacity></View></KeyboardAvoidingView></Modal>
      <Modal visible={isMealModalOpen} transparent={true} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setIsMealModalOpen(false)}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={styles.modalKeyboardContainer}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsMealModalOpen(false)} activeOpacity={1}><View style={styles.modalBackdropLayer} /></TouchableOpacity><View style={styles.modalContent}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{STRINGS.modals.newMeal.title}</Text><TouchableOpacity onPress={() => setIsMealModalOpen(false)} hitSlop={20}><MaterialCommunityIcons name="close" size={24} color="#6B7280" /></TouchableOpacity></View><Text style={styles.inputLabel}>{STRINGS.modals.newMeal.nameLabel}</Text><TextInput style={styles.input} placeholder={STRINGS.modals.newMeal.namePlaceholder} placeholderTextColor="#9CA3AF" value={newMealTitle} onChangeText={setNewMealTitle} /><Text style={styles.inputLabel}>{STRINGS.modals.newMeal.timeLabel}</Text><TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}><Text style={[styles.inputValueText, !newMealTime && styles.placeholderText]}>{newMealTime || "00:00"}</Text><MaterialCommunityIcons name="clock-outline" size={20} color="#6B7280" style={{ position: 'absolute', right: 16, top: 14 }} /></TouchableOpacity>{showTimePicker && (<DateTimePicker value={tempDate} mode="time" is24Hour={true} display="default" onChange={onChangeTime} />)}<TouchableOpacity style={styles.saveBtn} onPress={handleCreateMeal}><Text style={styles.saveBtnText}>{STRINGS.modals.newMeal.create}</Text></TouchableOpacity></View></KeyboardAvoidingView></Modal>
      {/* DATE PICKER GLOBAL */}
      {showTimePicker && (<DateTimePicker value={tempDate} mode="time" is24Hour={true} display="default" onChange={onChangeTime} />)}
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#191511', paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 10 },
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16, marginTop: 0 },
  scoreLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  scoreValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  ringValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  ringLabel: { color: '#9CA3AF', fontSize: 9, textTransform: 'uppercase' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  macroItem: { flex: 1 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  macroLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '700' },
  macroValue: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  scrollContainer: { flex: 1, marginTop: 12 },
  suggestionCard: { flexDirection: 'row', backgroundColor: '#FFFBEB', marginHorizontal: 20, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FCD34D', shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, alignItems: 'center', gap: 12 },
  suggestionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  suggestionTitle: { fontSize: 12, fontWeight: '800', color: '#D97706', textTransform: 'uppercase', marginBottom: 4 },
  suggestionText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  mealsContainer: { paddingHorizontal: 20, gap: 12 },
  mealCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, paddingHorizontal: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  mealTitle: { fontSize: 14, fontWeight: '800', color: '#191511' },
  mealSubtext: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  addMiniBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  foodList: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, gap: 6 },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodName: { fontSize: 13, fontWeight: '600', color: '#4B5563', flex: 1 },
  foodKcal: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  emptyMealText: { fontSize: 11, color: '#D1D5DB', fontStyle: 'italic', marginTop: 4, marginLeft: 42 },
  createNewMealBtn: { paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', marginBottom: 0 },
  createNewMealText: { color: '#6B7280', fontWeight: '700', fontSize: 14 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#191511', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  scannerTop: { alignItems: 'center' },
  scannerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  scannerSubtitle: { color: '#E5E7EB', fontSize: 14 },
  scannerMiddle: { width: width * 0.7, height: width * 0.7, borderWidth: 2, borderColor: '#008E00', borderRadius: 20 },
  scannerBottom: { alignItems: 'center' },
  scannerCloseBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  scannerWindow: { flex: 1, borderRadius: 18, overflow: 'hidden' },
  modalKeyboardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBackdropLayer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#191511' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#191511', marginBottom: 20, borderWidth: 1, borderColor: 'transparent' },
  inputValueText: { fontSize: 16, fontWeight: '600', color: '#191511' },
  placeholderText: { color: '#9CA3AF' },
  saveBtn: { backgroundColor: '#008E00', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  foodModalContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  foodModalContent: { flex: 1, backgroundColor: '#FAFAFA' },
  foodModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  foodModalTitle: { fontSize: 18, fontWeight: '800', color: '#191511' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, paddingHorizontal: 16, height: 50, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#191511', fontWeight: '600' },
  foodResultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  foodResultName: { fontSize: 16, fontWeight: '700', color: '#191511', marginBottom: 2 },
  foodResultMacros: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  foodResultAdd: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  foodResultKcal: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  bigInput: { fontSize: 48, fontWeight: '900', color: '#191511', borderBottomWidth: 2, borderBottomColor: '#F3F4F6', minWidth: 80, textAlign: 'center' },
  bigUnit: { fontSize: 18, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, marginLeft: 8 },
  calcPreview: { backgroundColor: '#F0FDF4', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'center', marginBottom: 24 },
  calcPreviewText: { color: '#008E00', fontWeight: '800', fontSize: 16 },
  unitSelectorContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  unitPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  unitPillActive: { backgroundColor: '#F0FDF4', borderColor: '#008E00' },
  unitPillText: { fontSize: 14, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  unitPillTextActive: { color: '#008E00', fontWeight: '700' },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 12, marginBottom: 24, width: '100%' },
  macroBox: { alignItems: 'center', flex: 1 },
  macroBoxValue: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  macroBoxLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },
  creationMenuCard: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' },
  creationMenuTitle: { fontSize: 18, fontWeight: '800', color: '#191511', marginBottom: 20, textAlign: 'center' },
  creationOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#FAFAFA', marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  creationIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  creationOptionTitle: { fontSize: 16, fontWeight: '700', color: '#191511' },
  creationOptionSub: { fontSize: 12, color: '#9CA3AF' },
  recipeIngredientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recipeTotalsCard: { backgroundColor: '#F0FDF4', padding: 16, borderRadius: 12, marginBottom: 20 },
  recipeTotalsTitle: { fontSize: 12, fontWeight: '700', color: '#008E00', marginBottom: 8, textTransform: 'uppercase' },
  recipeTotalsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  rtVal: { fontSize: 16, fontWeight: '800', color: '#191511' },
  rtLab: { fontSize: 10, color: '#6B7280' },
  addStepBtn: { width: 50, backgroundColor: '#191511', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', padding: 12, borderRadius: 12, marginBottom: 8 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumber: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
  stepText: { flex: 1, fontSize: 14, color: '#374151' },

  // --- STYLES DO MODAL DE DETALHE ---
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#191511' },
  detailSubtitle: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  closeIconBg: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 },
  detailItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailItemName: { fontSize: 16, fontWeight: '700', color: '#191511' },
  detailItemKcal: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  actionBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F0FDF4' },
  emptyListText: { textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', marginVertical: 20 },
  addFoodLargeBtn: { flexDirection: 'row', backgroundColor: '#191511', paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 },
  addFoodLargeText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  scanSuccessIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#008E00', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: "#008E00", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  scanTitle: { fontSize: 24, fontWeight: '800', color: '#191511', marginBottom: 4 },
  scanSubtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
  scannedProductCard: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, width: '100%', marginBottom: 24 },
  scannedProductName: { fontSize: 18, fontWeight: '700', color: '#191511', textAlign: 'center' },
  confirmScanBtn: { backgroundColor: '#008E00', width: '100%', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  confirmScanText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  cancelScanBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  cancelScanText: { color: '#6B7280', fontWeight: '600' },
  targetMealPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center' },
  targetMealPillActive: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#008E00' },
  targetMealText: { color: '#6B7280', fontWeight: '600' },
  targetMealTextActive: { color: '#008E00', fontWeight: '700' },
  deleteMealBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12, backgroundColor: '#FEF2F2' },
  deleteMealText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },

  // --- ESTILO FOTO PREVIEW ---
  photoPreviewContainer: { width: '100%', height: 250, backgroundColor: '#F3F4F6', borderRadius: 20, marginBottom: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },

  // --- BOTÃƒO ANALISAR (VERDE AGORA) ---
  analyzeBtn: {
    flexDirection: 'row',
    backgroundColor: '#008E00', // Alterado para VERDE
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10
  },
  analyzeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  waterControlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  waterInput: {
    fontSize: 24,
    fontWeight: '800',
    color: '#191511',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    width: '100%',
    paddingBottom: 4
  }
});
