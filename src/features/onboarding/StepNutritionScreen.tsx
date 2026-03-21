import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Opções de Dieta (Estilo de Vida)
const DIET_STYLES = [
  {
    id: 'classic',
    emoji: '🥩',
    title: 'Clássica / Flexível',
    desc: 'Como de tudo (Carnes, ovos, grãos, vegetais).',
  },
  {
    id: 'vegetarian',
    emoji: '🥗',
    title: 'Vegetariana',
    desc: 'Sem carnes, mas consumo ovos e laticínios.',
  },
  {
    id: 'vegan',
    emoji: '🌱',
    title: 'Vegana',
    desc: 'Nenhum produto de origem animal.',
  },
  {
    id: 'low_carb',
    emoji: '🥑',
    title: 'Low Carb',
    desc: 'Redução de carboidratos e foco em proteínas/gorduras.',
  },
  {
    id: 'keto',
    emoji: '🥓',
    title: 'Cetogênica',
    desc: 'Gorduras altas, proteína moderada, quase zero carbo.',
  },
];

// Opções de Alergias (Multi-seleção)
const ALLERGIES = [
  { id: 'gluten', label: 'Glúten 🍞' },
  { id: 'lactose', label: 'Lactose 🥛' },
  { id: 'seafood', label: 'Frutos do Mar 🦐' },
  { id: 'nuts', label: 'Amendoim/Nozes 🥜' },
  { id: 'eggs', label: 'Ovos 🥚' },
];

export default function StepNutritionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estados
  const [selectedDiet, setSelectedDiet] = useState<string>('classic'); // Default Clássica
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  // Toggle para alergias (Adiciona ou Remove do array)
  const toggleAllergy = (id: string) => {
    if (selectedAllergies.includes(id)) {
      setSelectedAllergies(prev => prev.filter(item => item !== id));
    } else {
      setSelectedAllergies(prev => [...prev, id]);
    }
  };

  const handleNext = () => {
    console.log({ 
      diet: selectedDiet, 
      allergies: selectedAllergies 
    });
    router.push('/onboarding/loading');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        
        {/* BARRA DE PROGRESSO: 100% (Última pergunta) */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
          <Text style={styles.stepText}>PASSO 5 DE 5</Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Preferências Alimentares</Text>
          <Text style={styles.subtitle}>
            Para gerar a lista de compras perfeita e não sugerir o que você não pode comer.
          </Text>

          {/* --- SEÇÃO 1: ESTILO DE DIETA (Radio Vertical) --- */}
          <Text style={styles.sectionLabel}>Qual seu estilo atual?</Text>
          <View style={styles.dietList}>
            {DIET_STYLES.map((diet) => {
              const isSelected = selectedDiet === diet.id;
              return (
                <TouchableOpacity
                  key={diet.id}
                  style={[styles.dietCard, isSelected && styles.dietCardSelected]}
                  onPress={() => setSelectedDiet(diet.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dietEmoji}>{diet.emoji}</Text>
                  <View style={styles.dietTextContainer}>
                    <Text style={[styles.dietTitle, isSelected && styles.textSelected]}>
                      {diet.title}
                    </Text>
                    <Text style={styles.dietDesc}>{diet.desc}</Text>
                  </View>
                  
                  {/* Radio Button Visual */}
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- SEÇÃO 2: INTOLERÂNCIAS (Chips/Tags) --- */}
          <Text style={styles.sectionLabel}>Alguma restrição ou alergia?</Text>
          <Text style={styles.helperText}>Selecione todas que se aplicam:</Text>
          
          <View style={styles.allergiesContainer}>
            {ALLERGIES.map((allergy) => {
              const isActive = selectedAllergies.includes(allergy.id);
              return (
                <TouchableOpacity
                  key={allergy.id}
                  style={[styles.allergyChip, isActive && styles.allergyChipSelected]}
                  onPress={() => toggleAllergy(allergy.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextSelected]}>
                    {allergy.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>

        {/* FOOTER - Botão FINALIZAR */}
        <View style={[
          styles.footer, 
          { paddingBottom: Math.max(insets.bottom, 20) }
        ]}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleNext}
          >
            <Text style={styles.finishButtonText}>GERAR MEU PLANO ✨</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  
  // --- PROGRESSO ---
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#008E00',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },

  // --- CABEÇALHO ---
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#191511',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191511',
    marginTop: 12,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    marginTop: -8,
  },

  // --- DIET CARDS ---
  dietList: {
    marginBottom: 24,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // Sombra leve
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dietCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#008E00',
    borderWidth: 2,
  },
  dietEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  dietTextContainer: {
    flex: 1,
  },
  dietTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191511',
    marginBottom: 2,
  },
  dietDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  textSelected: {
    color: '#008E00',
  },
  
  // Radio
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#008E00',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#008E00',
  },

  // --- INTOLERÂNCIAS (CHIPS) ---
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  allergyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  allergyChipSelected: {
    backgroundColor: '#DCFCE7', // Verde bem claro
    borderColor: '#008E00',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextSelected: {
    color: '#008E00',
  },

  // --- FOOTER ---
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  finishButton: {
    width: '100%',
    height: 60, // Botão ligeiramente maior para o final
    backgroundColor: '#191511', // Preto para diferenciar "Finalizar" ou manter Verde
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
});