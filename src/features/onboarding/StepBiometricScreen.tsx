import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity, // Importado para controlar o teclado
    TouchableWithoutFeedback // Importado para detectar toques fora
    ,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StepBiometricScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estados do Formulário
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isEnhanced, setIsEnhanced] = useState(false);

  const isFormValid = gender && age.length > 0 && weight.length > 0 && height.length > 0;

  const handleNext = () => {
    if (isFormValid) {
      console.log({ gender, age, weight, height, isEnhanced });
      router.push('/onboarding/activity');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Ajuste 1: KeyboardAvoidingView como wrapper principal 
        behavior="padding" no iOS é o que costuma funcionar melhor com Safe Areas
      */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Ajuste 2: TouchableWithoutFeedback para fechar teclado ao clicar fora 
           Nota: O ScrollView intercepta toques, então adicionamos logica nele tbm
        */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              // Ajuste 3: Fecha teclado ao arrastar a lista (UX Nativa)
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              
              {/* BARRA DE PROGRESSO */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: '40%' }]} />
                </View>
                <Text style={styles.stepText}>PASSO 2 DE 5</Text>
              </View>

              <Text style={styles.title}>Seus dados básicos</Text>
              <Text style={styles.subtitle}>
                A matemática da sua dieta começa aqui. Precisamos calibrar o motor da IA.
              </Text>

              {/* --- 1. SELETOR DE GÊNERO --- */}
              <Text style={styles.label}>Sexo Biológico</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity 
                  style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
                  onPress={() => { setGender('male'); Keyboard.dismiss(); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>Masculino</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
                  onPress={() => { setGender('female'); Keyboard.dismiss(); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>Feminino</Text>
                </TouchableOpacity>
              </View>

              {/* --- 2. INPUTS NUMÉRICOS --- */}
              <View style={styles.statsRow}>
                {/* IDADE */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Idade</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={3}
                      value={age}
                      onChangeText={setAge}
                      returnKeyType="next"
                    />
                    <Text style={styles.unitText}>anos</Text>
                  </View>
                </View>

                {/* ALTURA */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Altura</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={3}
                      value={height}
                      onChangeText={setHeight}
                      returnKeyType="next"
                    />
                    <Text style={styles.unitText}>cm</Text>
                  </View>
                </View>

                {/* PESO */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Peso</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="00.0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={5}
                      value={weight}
                      onChangeText={setWeight}
                      returnKeyType="done"
                    />
                    <Text style={styles.unitText}>kg</Text>
                  </View>
                </View>
              </View>

              {/* --- 3. SWITCH HORMONAL --- */}
              <View style={styles.enhancedContainer}>
                <View style={styles.enhancedHeader}>
                  <View>
                    <Text style={styles.enhancedTitle}>Condição Hormonal</Text>
                    <Text style={styles.enhancedSubtitle}>
                      Uso de ergogênicos / TRT
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#E5E7EB", true: "#008E00" }}
                    thumbColor={"#FFFFFF"}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => { setIsEnhanced(val); Keyboard.dismiss(); }}
                    value={isEnhanced}
                  />
                </View>
                {isEnhanced && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚠️ A IA aumentará drasticamente o volume de treino e ingestão proteica.
                    </Text>
                  </View>
                )}
              </View>

            </ScrollView>

            {/* FOOTER */}
            <View style={[
              styles.footer, 
              // Garante que o padding nunca seja menor que 20, mas respeite a safe area
              { paddingBottom: Math.max(insets.bottom, 20) }
            ]}>
              <TouchableOpacity 
                style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]} 
                onPress={handleNext}
                disabled={!isFormValid}
              >
                <Text style={styles.continueButtonText}>CONTINUAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1, // Garante que o scroll ocupe o espaço todo
  },
  // ... (RESTANTE DOS ESTILOS IGUAL AO ANTERIOR) ...
  // Apenas repetindo o final para contexto, mas o CSS não mudou a lógica
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
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191511',
    marginBottom: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  genderButton: {
    flex: 1,
    height: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderButtonSelected: {
    borderColor: '#008E00',
    backgroundColor: '#F0FDF4',
  },
  genderEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  genderTextSelected: {
    color: '#008E00',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  inputWrapper: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    minWidth: 0, // RN Web: sem isso o <input> nativo mantém sua largura intrínseca (~20 chars) e transborda/sobrepõe os campos vizinhos no layout flex
    fontSize: 18,
    fontWeight: '600',
    color: '#191511',
    textAlign: 'center',
  },
  unitText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  enhancedContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  enhancedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enhancedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191511',
  },
  enhancedSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  warningBox: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    // PaddingTop e Bottom controlados dinamicamente na renderização
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