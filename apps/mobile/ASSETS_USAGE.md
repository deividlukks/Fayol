# Como usar Assets Compartilhados no Mobile App

O package `@fayol/assets` fornece acesso centralizado a todas as imagens e
assets do projeto.

## Importação

```tsx
import { Images } from '@fayol/assets';
```

## Uso com React Native Image

```tsx
import { Image } from 'react-native';
import { Images } from '@fayol/assets';

function Logo() {
  return (
    <Image
      source={Images.logo}
      style={{ width: 200, height: 50 }}
      resizeMode="contain"
    />
  );
}
```

## Uso com Expo Image

```tsx
import { Image } from 'expo-image';
import { Images } from '@fayol/assets';

function Logo() {
  return (
    <Image
      source={Images.logo}
      style={{ width: 200, height: 50 }}
      contentFit="contain"
    />
  );
}
```

## Assets Disponíveis

- `Images.logo` - Logo principal do Fayol
- `Images.icon` - Ícone do app
- `Images.fayolId` - Identificação visual
- `Images.favicon` - Favicon (raramente usado no mobile)

## Benefícios

1. **Centralizadas**: Todas as imagens em um só lugar
2. **Type-safe**: Autocompletar e verificação de tipos
3. **Compartilhadas**: As mesmas imagens usadas no web e mobile
4. **Consistência**: Visual uniforme em todas as plataformas

## Exemplo Completo

```tsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Images } from '@fayol/assets';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={Images.logo} style={styles.logo} resizeMode="contain" />
      <Image source={Images.icon} style={styles.icon} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 250,
    height: 80,
    marginBottom: 20,
  },
  icon: {
    width: 100,
    height: 100,
  },
});
```
