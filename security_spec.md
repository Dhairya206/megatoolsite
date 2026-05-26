# Zero-Trust Firestore Security Specification

This document defines the mathematical access invariants, defensive boundaries, and threat testing procedures for the **MegaTool** Firebase synchronization backend.

## 1. Core Data Invariants

1. **User Identity Isolation**: A user's profile document `/users/{userId}` can only be read, created, or mutated by the authenticated user whose `request.auth.uid` matches the `{userId}` path parameter.
2. **Key-Space Whitelisting**: On profile creation, only `uid`, `displayName`, `email`, `favorites`, and `createdAt` are permitted.
3. **Temporal Invariant**: The creation timestamp `createdAt` must exactly match the trusted server timestamp (`request.time`) and cannot be altered on subsequent updates.
4. **Favorites Immutability**: All fields other than `favorites` and a visual profile pointer must remain completely immutable during routine tool preference updates.
5. **No System Overrides**: Setting administrative status, email-verification bypasses, or other phantom fields is strictly forbidden.

---

## 2. The "Dirty Dozen" Vulnerability Vectors

The following is a list of adversarial payloads designed to break our synchronization safety rules:

1. **Identity Spoofing (Create)**: Attempting to register `/users/alice` with `request.auth.uid` as `'bob'`.
2. **Identity Spoofing (Update)**: Bob attempting to insert a new favorite tool on `/users/alice`.
3. **Ghost Field Poisoning**: Inserting `isSystemAdmin: true` during profile creation.
4. **Creation Timestamp Spoofing**: Setting `createdAt` to a date in 2035 instead of using `request.time`.
5. **Modification of CreatedAt on Update**: Attempting to back-date or change the initial sign-up date field.
6. **Self-Elevating User Roles**: Setting `role: "administrator"` inside the user document update payload.
7. **Junk Character Path Injection**: Passing `userId` with thousands of complex ASCII symbols or non-alphanumeric chars.
8. **PII Exfiltration (Blanket Read)**: Unauthorized users querying the entire list of user profiles.
9. **Unauthenticated Write**: An unauthenticated guest trying to directly set document settings.
10. **Favorites List Bombing**: Overwriting the `favorites` list with an array exceeding the 100 bookmark limit.
11. **Type Poisoning**: Sending `favorites` as a raw string or integer instead of an array of strings.
12. **Null Email Registration**: Submitting a profile without a verified email format when `request.auth` requires it.

---

## 3. Test Invariant Outlines

```ts
// firestore.rules.test.ts outline
// Tested in mock environments or local emulator suites:
// 1. Assert: unauthenticated read of '/users/bob' is blocked.
// 2. Assert: bob writing to '/users/alice' is blocked.
// 3. Assert: bob writing valid info to '/users/bob' is allowed.
```
