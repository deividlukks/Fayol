// Exporta os caminhos das imagens para uso em diferentes plataformas

// Para uso no React Native/Expo (mobile)
// No mobile, você usará: import { Images } from '@fayol/assets'
// E então: <Image source={Images.logo} />
export const Images = {
  // Logos e Ícones
  logo: require('./images/logo.png') as number,
  icon: require('./images/icon.png') as number,
  fayolId: require('./images/fayol-id.png') as number,
  fayol3D: require('./images/Fayol 3D.png') as number,
  favicon: require('./images/favicon.ico') as number,

  // Mascotes
  mascote: require('./images/Mascote.png') as number,
  mascoteFinanceiroFayol: require('./images/Mascote Financeiro Fayol.png') as number,

  // Gestores
  gestor: require('./images/Gestor.png') as number,
  gestorFinanceiro: require('./images/Gestor Financeiro.png') as number,
  gestorFinanceiroFayol: require('./images/Gestor Financeiro Fayol.png') as number,
};

// Para uso no Next.js (web-app)
// No web, você usará: import { ImagePaths } from '@fayol/assets'
// E então: <Image src={ImagePaths.logo} />
export const ImagePaths = {
  // Logos e Ícones
  logo: '/assets/logo.png',
  icon: '/assets/icon.png',
  fayolId: '/assets/fayol-id.png',
  fayol3D: '/assets/Fayol 3D.png',
  favicon: '/assets/favicon.ico',

  // Mascotes
  mascote: '/assets/Mascote.png',
  mascoteFinanceiroFayol: '/assets/Mascote Financeiro Fayol.png',

  // Gestores
  gestor: '/assets/Gestor.png',
  gestorFinanceiro: '/assets/Gestor Financeiro.png',
  gestorFinanceiroFayol: '/assets/Gestor Financeiro Fayol.png',
} as const;

// Tipos para TypeScript
export type ImageKey = keyof typeof Images;
export type ImagePathKey = keyof typeof ImagePaths;
