import { Redirect } from 'expo-router';

export default function Index() {
  // Redireciona da rota raiz (/) para a tela de login (/login)
  return <Redirect href="/login" />;
}