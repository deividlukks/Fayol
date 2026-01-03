# 📱 Guia Mestre de Desenvolvimento Mobile - Fayol

> Documentação técnica completa, arquitetura e guias de deploy do aplicativo móvel.

**Status do Módulo**: ✅ Produção (Versão 1.0.0)
**Stack**: React Native (Expo 54), TanStack Query, SQLite (Offline-first)

---

## 📋 Índice

1. [Visão Geral & Arquitetura](#1-visão-geral--arquitetura)
2. [Autenticação Biométrica](#2-autenticação-biométrica)
3. [Offline-First & Sincronização](#3-offline-first--sincronização)
4. [OCR & Scanner de Recibos](#4-ocr--scanner-de-recibos)
5. [Geolocalização](#5-geolocalização)
6. [Push Notifications](#6-push-notifications)
7. [Performance & Otimização](#7-performance--otimização)
8. [Widgets (Home Screen)](#8-widgets-home-screen)
9. [Guia de Deploy (Stores)](#9-guia-de-deploy-stores)

---

## 1. Visão Geral & Arquitetura

O app mobile foi transformado de uma versão básica para uma **premium native experience**.

### Stack Tecnológico
- **Core**: Expo 54, React Native 0.81.5
- **Navegação**: React Navigation 7
- **Estado/Cache**: TanStack Query (React Query)
- **Persistência**: SQLite (Expo SQLite) + MMKV
- **Segurança**: Expo Secure Store

---

## 2. Autenticação Biométrica

**Status**: ✅ Completo
**Serviço**: `BiometricService` (`apps/mobile/src/services/BiometricService.ts`)

Funcionalidade robusta para autenticação via Face ID, Touch ID ou Impressão Digital.

### Funcionalidades
- Detecção automática de hardware disponível.
- Armazenamento seguro de tokens via `Keychain` (iOS) e `KeyStore` (Android).
- Fallback automático para senha do dispositivo.
- Tratamento de erros (bloqueio por tentativas, cancelamento).

### Uso no Código
```typescript
// Verificar disponibilidade
const isAvailable = await BiometricService.isAvailable();

// Autenticar
const result = await BiometricService.authenticate('Confirme sua identidade para acessar');

3. Offline-First & Sincronização
Status: ✅ Completo Serviço: DatabaseService (apps/mobile/src/database/DatabaseService.ts)

Arquitetura que permite uso total do app sem internet, com sincronização automática quando a conexão retorna.

Arquitetura de Dados
Banco Local: SQLite com tabelas espelhadas do backend.

Fila de Sync: Tabela _sync_queue armazena operações (CREATE, UPDATE, DELETE) feitas offline.

Versionamento: Controle de versão (local_version vs server_version) para resolução de conflitos.

Monitoramento de Rede
O NetworkService monitora o estado da conexão e dispara a sincronização automaticamente quando o dispositivo volta a ficar online (WiFi ou Celular).

4. OCR & Scanner de Recibos
Status: ✅ Completo Serviço: OCRService (apps/mobile/src/services/OCRService.ts)

Utiliza Google ML Kit para extração inteligente de dados de notas fiscais e recibos.

Capacidades
Parser Inteligente: Identifica padrões de recibos brasileiros (CNPJ, Data, Total, Itens).

Extração: Valor total, data da compra, nome do estabelecimento e lista de itens.

Interface: Câmera integrada com feedback visual de processamento.

5. Geolocalização
Status: ✅ Completo Serviço: LocationService (apps/mobile/src/services/LocationService.ts)

Captura automática de coordenadas nas transações para mapas de gastos.

Modos: Foreground (durante uso) e Background (opcional).

Geocodificação: Converte Lat/Long em endereço legível (Rua, Bairro, Cidade).

Cache: Cache inteligente para economizar bateria e requisições.

6. Push Notifications
Status: ✅ Completo Serviço: PushNotificationService

Sistema completo de notificações integrado com Firebase (FCM) e Expo Push API.

Setup Rápido
Configure o projeto no Firebase Console.

Baixe google-services.json (Android) e GoogleService-Info.plist (iOS).

Coloque na raiz de apps/mobile/.

Canais de Notificação (Android)
default: Geral

budget-alerts: Alertas de orçamento estourado

insights: Dicas da IA financeira

7. Performance & Otimização
Metas atingidas: TTI < 2s, Render < 16ms (60 FPS).

Utilitários Implementados (src/utils/performance.ts)
Batch Processing: Processamento de arrays grandes em chunks para não travar a UI.

Memoization: Cache de cálculos pesados.

Debounce/Throttle: Otimização de inputs e eventos de scroll.

Listas Otimizadas: Componente OptimizedList com virtualização avançada (FlashList).

8. Widgets (Home Screen)
Blueprint para implementação de Widgets nativos (Swift/Kotlin) integrados ao Expo via Config Plugins.

Tipos Planejados
Saldo Geral: Visão rápida do saldo total.

Barra de Orçamento: Progresso dos gastos do mês.

Atalho de Transação: Botão rápido para lançar despesa.

Nota: Requer migração para Bare Workflow ou Prebuild.

9. Guia de Deploy (Stores)
App Store (iOS)
Criar App ID (com.fayol.app) no Apple Developer.

Gerar certificados de distribuição.

Configurar app.json com Bundle ID.

Build via EAS: eas build --platform ios.

Google Play (Android)
Criar conta no Google Play Console.

Gerar Keystore de upload.

Configurar app.json com Package Name.

Build via EAS: eas build --platform android.