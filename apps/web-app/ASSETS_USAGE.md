# Como usar Assets Compartilhados no Web App

O package `@fayol/assets` fornece acesso centralizado a todas as imagens e assets do projeto.

## Importação

```tsx
import { ImagePaths } from '@fayol/assets';
```

## Uso com Next.js Image

```tsx
import Image from 'next/image';
import { ImagePaths } from '@fayol/assets';

function Logo() {
  return (
    <Image
      src={ImagePaths.logo}
      alt="Fayol Logo"
      width={200}
      height={50}
    />
  );
}
```

## Uso com tag HTML img

```tsx
import { ImagePaths } from '@fayol/assets';

function Favicon() {
  return (
    <link rel="icon" href={ImagePaths.favicon} />
  );
}
```

## Assets Disponíveis

- `ImagePaths.logo` - Logo principal do Fayol
- `ImagePaths.icon` - Ícone do app
- `ImagePaths.fayolId` - Identificação visual
- `ImagePaths.favicon` - Favicon do site

## Build

Os assets são automaticamente copiados para `public/assets` durante:
- `pnpm dev` - Para desenvolvimento
- `pnpm build` - Para produção

Você não precisa fazer nada além de usar o `ImagePaths` importado!
