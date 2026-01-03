# @fayol/assets

Package compartilhado de assets (imagens, ícones, etc) para os apps web e mobile do Fayol.

## Estrutura

```
packages/assets/
├── src/
│   ├── images/          # Imagens originais
│   │   ├── logo.png
│   │   ├── icon.png
│   │   ├── fayol-id.png
│   │   └── favicon.ico
│   └── index.ts         # Exports
└── package.json
```

## Uso

### Web App (Next.js)

Para o web app, as imagens precisam estar na pasta `public`. Use o script de cópia ou configure o Next.js para acessar os assets:

```tsx
import { ImagePaths } from '@fayol/assets';
import Image from 'next/image';

function Logo() {
  return <Image src={ImagePaths.logo} alt="Fayol" width={200} height={50} />;
}
```

Ou copie os assets para `public/assets` durante o build:

```json
{
  "scripts": {
    "prebuild": "pnpm run copy:assets",
    "copy:assets": "cp -r node_modules/@fayol/assets/src/images public/assets"
  }
}
```

### Mobile App (React Native/Expo)

Para o mobile, use os requires diretos:

```tsx
import { Images } from '@fayol/assets';
import { Image } from 'react-native';

function Logo() {
  return <Image source={Images.logo} style={{ width: 200, height: 50 }} />;
}
```

## Adicionando Novas Imagens

1. Adicione a imagem em `src/images/`
2. Exporte-a em `src/index.ts`:

```ts
export const Images = {
  // ...
  novaImagem: require('./images/nova-imagem.png'),
} as const;

export const ImagePaths = {
  // ...
  novaImagem: '/assets/nova-imagem.png',
} as const;
```

3. Execute `pnpm build` no package

## Scripts

- `pnpm build` - Compila TypeScript e copia assets
- `pnpm clean` - Remove arquivos de build
- `pnpm type-check` - Verifica tipos TypeScript
