# WhatsDeX Hidden Pages Discovery Report

This report documents the identification of "hidden" or "unwired" navigation paths and pages within the WhatsDeX dashboard. These are valid routes that exist in the filesystem but are not currently surfacing in the sidebar or main navigation.

## 🕵️ Executive Summary

Several advanced modules (Omnichannel Hub, Skills Store) and specialized configuration pages (Tenant Settings) are fully implemented or in-progress but lack visibility. Additionally, certain sub-routes like Campaign details are technically reachable but have no parent listing page.

## 📍 Discovery Grid

| Page Name | Deep Link (Local) | File Source Path | Status / Observations |
| :--- | :--- | :--- | :--- |
| **Omnichannel Hub** | [/dashboard/omnichannel](http://localhost:3000/dashboard/omnichannel) | `src/app/(dashboard)/dashboard/omnichannel/page.tsx` | **Ready**. Central command for multi-platform connections. |
| **Skills Store** | [/dashboard/omnichannel/skills](http://localhost:3000/dashboard/omnichannel/skills) | `src/app/(dashboard)/dashboard/omnichannel/skills/page.tsx` | **Ready**. Marketplace for enhancing bots with plugins. |
| **Tenant Settings** | [/settings](http://localhost:3000/settings) | `src/app/(dashboard)/settings/page.tsx` | **Hidden**. High-level org profile & feature toggles. Distinct from Workspace Settings. |
| **Campaign Details** | `/dashboard/messages/campaigns/[id]` | `src/app/(dashboard)/dashboard/messages/campaigns/[id]/page.tsx` | **Unwired**. No index page exists at `/dashboard/messages/campaigns`. |
| **Dashboard Skills** | `/dashboard/omnichannel/skills` | `src/app/(dashboard)/dashboard/omnichannel/skills/page.tsx` | **Hidden**. Nested under Omnichannel but serves global bot enhancements. |

## 🛠️ Recommendations

### 1. Sidebar Integration
Add `Omnichannel` and `Skills Store` to the primary navigation in `Sidebar.tsx`.
- **Omnichannel**: Use `LayoutGrid` icon.
- **Skills Store**: Use `Zap` icon.

### 2. Settings Consolidation
The existence of two separate settings pages (`/dashboard/settings` and `/settings`) is likely to cause user confusion.
- **Option A**: Merge Tenant Settings as a tab within the Workspace Settings page.
- **Option B**: Clearly label them as "Account Settings" (Global) vs "Workspace Config" (Local).

### 3. Campaign Index Page
A missing index page for Campaigns makes the detail pages orphans. An index page should be created at `src/app/(dashboard)/dashboard/messages/campaigns/page.tsx` to list all campaigns.

---
*Report Generated: 2026-02-17*
