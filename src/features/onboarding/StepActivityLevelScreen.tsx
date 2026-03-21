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

// Adicionamos Emojis para criar conexão emocional imediata
const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    emoji: '🛋️',
    title: 'Sedentário',
    description: 'Trabalho de escritório, passo o dia sentado. Pouco ou nenhum exercício.',
  },
  {
    id: 'light',
    emoji: '🚶',
    title: 'Levemente Ativo',
    description: 'Caminhadas leves ou exercícios ocasionais (1-3 dias/sem).',
  },
  {
    id: 'moderate',
    emoji: '🏃',
    title: 'Moderadamente Ativo',
    description: 'Exercícios físicos regulares ou esportes (3-5 dias/sem).',
  },
  {
    id: 'very_active',
    emoji: '🔥',
    title: 'Muito Ativo',
    description: 'Treinos intensos ou trabalho físico diário (6-7 dias/sem).',
  },
  {
    id: 'extra_active',
    emoji: '🚀',
    title: 'Atleta / Extremo',
    description: 'Rotina de atleta profissional, dois treinos por dia ou trabalho pesado.',
  },
];

export default function StepActivityLevelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedLevel) {
      console.log('Nível selecionado:', selectedLevel);
      router.push('/onboarding/workout');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        
        {/* BARRA DE PROGRESSO */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            {/* 60% preenchido pois é o passo 3 de 5 */}
            <View style={[styles.progressBarFill, { width: '60%' }]} />
          </View>
          <Text style={styles.stepText}>PASSO 3 DE 5</Text>
        </View>

        <Text style={styles.title}>Qual seu nível de atividade?</Text>
        <Text style={styles.subtitle}>
          Isso define seu "combustível" diário (TDEE). Seja honesto para a dieta funcionar!
        </Text>

        <ScrollView
          style={styles.optionsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {ACTIVITY_LEVELS.map((level) => {
            const isSelected = selectedLevel === level.id;
            
            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.optionCard, 
                  isSelected && styles.optionCardSelected
                ]}
                onPress={() => setSelectedLevel(level.id)}
                activeOpacity={0.9}
              >
                {/* Lado Esquerdo: Emoji */}
                <View style={styles.iconContainer}>
                  <Text style={styles.emoji}>{level.emoji}</Text>
                </View>

                {/* Centro: Textos */}
                <View style={styles.textContainer}>
                  <Text style={[
                    styles.optionTitle, 
                    isSelected && styles.optionTitleSelected
                  ]}>
                    {level.title}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {level.description}
                  </Text>
                </View>

                {/* Lado Direito: Radio Button */}
                <View style={[
                  styles.radioButton, 
                  isSelected && styles.radioButtonSelected
                ]}>
                  {isSelected && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FOOTER RESPONSIVO */}
        <View style={[
          styles.footer, 
          { paddingBottom: Math.max(insets.bottom, 20) }
        ]}>
          <TouchableOpacity
            style={[
              styles.continueButton, 
              !selectedLevel && styles.continueButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!selectedLevel}
          >
            <Text style={styles.continueButtonText}>CONTINUAR</Text>
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  // --- PROGRESSO ---
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  // --- CARDS ---
  optionsList: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row', // Alinha Ícone - Texto - Radio horizontalmente
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    // Sombra leve para dar profundidade (Material Design vibe)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: '#008E00',
    backgroundColor: '#F0FDF4', // Verde bem clarinho
    borderWidth: 2, // Borda mais grossa ao selecionar
  },
  
  // Ícone Esquerdo
  iconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 28,
  },

  // Textos Centrais
  textContainer: {
    flex: 1, // Ocupa o espaço que sobrar
    paddingRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191511',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#008E00',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Radio Button Direito
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#008E00',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#008E00',
  },

  // --- FOOTER ---
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#008E00',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#008E00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});