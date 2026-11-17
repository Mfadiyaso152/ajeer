# Security Specification — Work Permit Demo Portal

## 1. Data Invariants
1. **Default Demo Read Access vs. Admin Write Gate**: `/permits/default_demo` may be read publicly for display, while `create`, `update`, and `delete` on `/permits/{permitId}` require a verified admin (`request.auth != null && request.auth.token.email_verified == true` and matching bootstrapped admin email or `/admins/{uid}` membership).
2. **Strict Schema & Size Enforcement**: Every string field in `PermitRecord`, `AdminUser`, and `SupportInquiry` has explicit `.size()` and format checks (`YYYY-MM-DD` regex for dates, `<= 180000` bytes for compressed logo data URL), plus `keys().hasAll(...)` and `keys().hasOnly(...)` to block shadow fields.
3. **Server Timestamp Integrity**: `updatedAt` and `createdAt` must equal `request.time`.
4. **PII & Inquiry Isolation**: `/admins/{userId}` can only be read by the owning user or an admin; `/supportInquiries/{inquiryId}` can only be read/listed by the owner (`resource.data.userId == request.auth.uid`) or an admin, and never exposed via blanket `isSignedIn()` reads.
5. **Path Hardening**: All single-document operations enforce `isValidId(...)` (`^[a-zA-Z0-9_-]+$`, `<= 128` chars).

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated write to `/permits/default_demo`.
2. Authenticated non-admin write to `/permits/default_demo`.
3. Admin write with unverified email (`email_verified == false`).
4. Shadow field injection (`isOfficialVerified: true`) on `/permits/default_demo`.
5. Oversized `customLogoDataUrl` (`> 180000` chars) to exhaust document budget.
6. Invalid date string (`"not-a-date"`) in `startDate`, `endDate`, or `birthDate`.
7. Client-forged `updatedAt` timestamp (`!= request.time`) on `/permits/default_demo`.
8. Spoofed `updatedBy` UID (`!= request.auth.uid`) by an attacker.
9. Self-escalation by creating `/admins/{attackerUid}` as a non-admin user.
10. Blanket `list` query on `/supportInquiries` without `userId == request.auth.uid` filter by a non-admin.
11. Creating a `supportInquiry` with `userId` set to another user's UID.
12. Poisoned oversized document ID (`1500` chars) on `/permits/{id}`.
