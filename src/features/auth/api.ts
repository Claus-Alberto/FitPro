
 /**
  * Simula uma chamada de API para o endpoint de login.
  * Em um app real, isso seria uma chamada de rede (ex: com fetch ou axios).
  *
  * @param requestBody O corpo da requisição, conforme definido na sua especificação.
  * @returns Uma Promise que resolve com a resposta mockada da API após um atraso.
  */
 export const mockLoginApi = (requestBody: any): Promise<any> => {
   console.log('--- [API MOCK] ---');
   console.log('Recebendo requisição para /api/v1/auth/login com o corpo:');
   console.log(JSON.stringify(requestBody, null, 2));
 
   return new Promise((resolve) => {
     // Simula um atraso de rede (ex: 1 segundo)
     setTimeout(() => {
       const mockResponse = {
         meta: {
           status: 'success',
           message: 'Login realizado com sucesso',
         },
         data: {
           session: {
             access_token: 'jwt_fake_token_acesso_api_12345',
             refresh_token: 'jwt_fake_token_renovacao_67890',
             expires_in: 3600,
             token_type: 'Bearer',
           },
           user: {
             id: `uuid-${Math.random().toString(36).substring(2, 10)}`,
             name: 'Usuário Mockado',
             email: requestBody.payload.email || 'social-user@fitpro.com',
             avatar_url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
             gamification: {
               level: 1,
               points: 0,
             },
             goal: 'hypertrophy',
             market: 'weekly',
             activity: '0/7',
           },
           flags: {
             is_new_user: false,
             has_completed_onboarding: false,
             subscription_tier: 'free',
             is_admin: false,
           },
         },
       };
 
       console.log('Enviando resposta mockada:');
       console.log(JSON.stringify(mockResponse, null, 2));
       console.log('--- [FIM API MOCK] ---');
 
       resolve(mockResponse);
     }, 1000);
   });
 };