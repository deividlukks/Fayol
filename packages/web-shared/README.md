# @fayol/web-shared

Shared contexts, hooks, and utilities for Fayol web applications (web-app and
admin-panel).

## Contents

### Contexts

- `AuthContext` - Authentication state management

### Hooks

- `useAdminUsers` - Admin user management operations
- `useAuditLogs` - Audit log operations

## Usage

```typescript
import { AuthProvider, useAuth } from '@fayol/web-shared';
import { useAdminUsers, useAuditLogs } from '@fayol/web-shared';
```

## Development

```bash
# Build the package
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```
