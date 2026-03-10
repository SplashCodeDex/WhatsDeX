import type { PluginSlotsConfig } from "../config/types.plugins.js";

export type PluginKind = "memory";

export type PluginSlotKey = keyof PluginSlotsConfig;

export const SLOT_BY_KIND: Record<PluginKind, PluginSlotKey> = {
  memory: "memory",
};

export const DEFAULT_SLOT_BY_KEY: Record<PluginSlotKey, string> = {
  memory: "memory-core",
};

export function slotKeyForPluginKind(kind?: PluginKind): PluginSlotKey | null {
  if (!kind) {
    return null;
  }
  return SLOT_BY_KIND[kind] ?? null;
}

export function defaultSlotIdForKey(slotKey: PluginSlotKey): string {
  return DEFAULT_SLOT_BY_KEY[slotKey];
}
