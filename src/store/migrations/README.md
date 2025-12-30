# Migration System

Bu klasör state structure değişikliklerinde data kaybını önlemek için versioned migration system içerir.

## Nasıl Çalışır?

1. Her state structure değişikliğinde `CURRENT_VERSION` artırılır
2. Her version için bir migration function yazılır
3. Redux Persist rehydrate sırasında otomatik olarak migration'ları uygular

## Yeni Migration Ekleme

### Adım 1: Version Artır

`src/store/index.ts` dosyasında:
```typescript
const CURRENT_VERSION = 2; // 1'den 2'ye artır
```

### Adım 2: Migration Function Oluştur

`src/store/migrations/v1-to-v2.ts` dosyası oluştur:
```typescript
import { PersistedState } from './types';

export const v1ToV2Migration = async (state: PersistedState): Promise<PersistedState> => {
  return {
    ...state,
    portfolio: {
      ...state.portfolio,
      // Yeni field'lar ekle
      newField: defaultValue,
    },
  };
};
```

### Adım 3: Migration'ı Register Et

`src/store/migrations/index.ts` dosyasında:
```typescript
import { v1ToV2Migration } from './v1-to-v2';

const MIGRATIONS: MigrationMap = {
  2: v1ToV2Migration, // Version 2 migration'ı ekle
};
```

## Best Practices

1. **Backward Compatible**: Mümkünse eski field'ları koru
2. **Default Values**: Yeni field'lar için mantıklı default değerler kullan
3. **Validation**: Migration sonrası state'i validate et
4. **Testing**: Her migration'ı test et
5. **Documentation**: Migration'ın ne yaptığını dokümante et

## Örnek Senaryolar

### Senaryo 1: Yeni Field Ekleme
```typescript
export const v1ToV2Migration = async (state: PersistedState): Promise<PersistedState> => {
  return {
    ...state,
    portfolio: {
      ...state.portfolio,
      newField: 'defaultValue',
    },
  };
};
```

### Senaryo 2: Field Adı Değiştirme
```typescript
export const v1ToV2Migration = async (state: PersistedState): Promise<PersistedState> => {
  const oldField = state.portfolio?.oldFieldName;
  return {
    ...state,
    portfolio: {
      ...state.portfolio,
      newFieldName: oldField || defaultValue,
      // oldFieldName'i kaldır (optional)
    },
  };
};
```

### Senaryo 3: Nested Structure Değişikliği
```typescript
export const v1ToV2Migration = async (state: PersistedState): Promise<PersistedState> => {
  return {
    ...state,
    portfolio: {
      ...state.portfolio,
      nested: {
        ...state.portfolio?.nested,
        newNestedField: defaultValue,
      },
    },
  };
};
```

## Test Etme

Migration'ları test etmek için:
1. Eski version state'i oluştur
2. Migration'ı uygula
3. Yeni state'in doğru olduğunu kontrol et

```typescript
// Test örneği
const oldState = {
  _persist: { version: 1 },
  portfolio: { /* eski state */ }
};

const newState = await v1ToV2Migration(oldState);
expect(newState._persist.version).toBe(2);
expect(newState.portfolio.newField).toBeDefined();
```

