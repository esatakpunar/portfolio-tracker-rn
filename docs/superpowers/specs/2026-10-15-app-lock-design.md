# Uygulama kilidi (PIN / biyometrik) — Design Spec

**Date:** 2026-10-15  
**Status:** Approved (conversation)  
**Depends on:** —

## Goal

Opsiyonel kilit: uygulama açılışında ve arka plandan dönüşte (configurable) doğrulama.

## Approach

- `expo-local-authentication` for Face ID / Touch ID / device PIN.
- Optional **4–6 digit app PIN** stored as hash in `app_settings` (`pin_hash`, `pin_enabled`) — use simple SHA-256 + salt via `expo-crypto` (not plaintext).
- Settings: enable/disable, change PIN, “Require on resume” toggle.

## Flow

- Lock screen component wrapping navigator when enabled and not unlocked this session.
- Background > N minutes (e.g. 5) re-lock if “require on resume”.

## Non-goals

- SQLite encryption at rest.
- JSON export encryption.

## Manual test

- Enable PIN → kill app → prompted.
- Wrong PIN → stay locked.
- Biometric fallback when available.
