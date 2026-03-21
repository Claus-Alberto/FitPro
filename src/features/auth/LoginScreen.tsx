import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockLoginApi } from './api';

// Necessário para o fluxo de autenticação web funcionar corretamente
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Estados para controlar o foco dos inputs
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // --- Configuração da Autenticação Google ---
  // Substitua os valores abaixo pelos seus IDs de cliente do Google Cloud Console
  // Você pode encontrá-los em: https://console.cloud.google.com/apis/credentials
  const [request, response, promptAsync] = useAuthRequest({
    iosClientId: '852457605462-02vuoqh3ctl2kbu8iog05pkmk6jfa78n.apps.googleusercontent.com',
    androidClientId: '852457605462-p628u8n4jj2cahcbia5c27oo4593gp9k.apps.googleusercontent.com',
    webClientId: '852457605462-viprh5ifelopkq5rv0ur9uogpo92pnvk.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      console.log('Autenticação Google bem-sucedida! Token recebido:', id_token);

      // --- SIMULAÇÃO DE LOGIN COM GOOGLE ---
      const requestBody = {
        method: 'social',
        provider: 'google',
        payload: {
          id_token: id_token,
        },
        device_info: {
          os: Platform.OS,
          model: 'Device Mock', // Em um app real, você usaria uma lib como 'expo-device'
          push_token: 'exponent:mock_push_token', // Em um app real, você usaria 'expo-notifications'
        },
      };

      mockLoginApi(requestBody).then((apiResponse) => {
        console.log('Resposta da API Mockada (Google):', apiResponse);
        const { is_new_user } = apiResponse.data.flags;

        if (is_new_user) {
          router.replace('/onboarding');
        } else {
          router.replace('/home');
        }
      });
    } else if (response?.type === 'error') {
      console.error('Erro na autenticação Google:', response.error);
    }
  }, [response]);
  // -----------------------------------------

  // --- Lógica da Autenticação Apple ---
  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log('Credenciais Apple recebidas:', credential);
      // `credential.identityToken` é o que você enviará para o seu backend para verificação

      // --- SIMULAÇÃO DE LOGIN COM APPLE ---
      const requestBody = {
        method: 'social',
        provider: 'apple',
        payload: {
          id_token: credential.identityToken,
        },
        device_info: {
          os: Platform.OS,
          model: 'iPhone Mock',
          push_token: 'exponent:mock_push_token',
        },
      };

      mockLoginApi(requestBody).then((apiResponse) => {
        console.log('Resposta da API Mockada (Apple):', apiResponse);
        const { is_new_user } = apiResponse.data.flags;

        if (is_new_user) {
          router.replace('/onboarding');
        } else {
          router.replace('/home');
        }
      });
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('Usuário cancelou o login com a Apple.');
      } else {
        console.error('Erro na autenticação Apple:', e);
      }
    }
  };
  // ------------------------------------

  const handleLogin = () => {
    console.log('Tentando logar com e-mail/senha:', email);

    // --- SIMULAÇÃO DE LOGIN COM E-MAIL ---
    const requestBody = {
      method: 'email',
      provider: 'email',
      payload: {
        email: email,
        password: password,
      },
      device_info: {
        os: Platform.OS,
        model: 'Device Mock',
        push_token: 'exponent:mock_push_token',
      },
    };

    mockLoginApi(requestBody).then((apiResponse) => {
      console.log('Resposta da API Mockada (E-mail):', apiResponse);
      const { is_new_user } = apiResponse.data.flags;

      if (is_new_user) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
      >
        
        {/* --- 1. LOGO E CABEÇALHO --- */}
        <View style={styles.headerContainer}>
          <View style={styles.logoHeader}>
            <Image source={require('../../../assets/images/logotipobg.png')} style={styles.logoImage} />
          </View>
          
          <Text style={styles.subtitle}>
            Entre para gerenciar sua rotina e alcançar seus objetivos.
          </Text>
        </View>

        {/* --- 2. FORMULÁRIO --- */}
        <View style={styles.formContainer}>
          
          {/* Input Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}>
              <Feather name="mail" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.textInput}
                placeholder="seu@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
          </View>

          {/* Input Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperFocused]}>
              <Feather name="lock" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.textInput}
                placeholder="Sua senha secreta"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Feather name={secureText ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>

        {/* --- 3. DIVISOR --- */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Ou continue com</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* --- 4. SOCIAL LOGIN --- */}
        <View style={styles.socialLoginContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            disabled={!request}
            onPress={() => {
              promptAsync();
            }}
          >
            <FontAwesome5 name="google" size={24} color="#DB4437" />
          </TouchableOpacity>

          {/* O login com a Apple só funciona em dispositivos iOS. */}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={30}
              style={styles.appleButton}
              onPress={handleAppleLogin}
            />
          )}
        </View>

        {/* --- 5. RODAPÉ (CADASTRO) --- */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Não tem uma conta? </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Criar agora</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoiding: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 8,
  },
  logoIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  logoHeaderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#191511',
  },
  logoImage: {
    width: 360,
    height: 60,
    resizeMode: 'contain',
  },
  logoHeaderTextPro: {
    color: '#008E00',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  // Formulário
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16, // Simula o space-y-4
  },
  inputLabel: {
    color: '#191511',
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    width: '100%',
    height: 56,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: '#008E00',
    borderWidth: 1.5, // Dá um destaque maior
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    color: '#191511',
    fontSize: 16,
  },
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#008E00',
    fontWeight: '500',
  },
  // Botão de Login
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#008E00',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8, // Adiciona um espaço acima
    // Sombra para Android
    elevation: 3,
    // Sombra para iOS
    shadowColor: '#A7F3D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  // Divisor
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  // Social Login
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appleButton: {
    width: 60,
    height: 60,
  },
  // Rodapé
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  signupText: {
    color: '#6B7280',
    fontSize: 16,
  },
  signupLink: {
    color: '#008E00',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
