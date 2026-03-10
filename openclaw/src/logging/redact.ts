import type { OpenClawConfig } from "../config/config.js";
import { resolveNodeRequireFromMeta } from "./node-require.js";
import {
  DEFAULT_REDACT_MODE,
  DEFAULT_REDACT_PATTERNS,
  RedactOptions,
  RedactSensitiveMode,
  redactSensitiveText as lightweightRedact,
} from "./identifiers.js";

export {
  DEFAULT_REDACT_KEEP_END,
  DEFAULT_REDACT_KEEP_START,
  DEFAULT_REDACT_MIN_LENGTH,
  DEFAULT_REDACT_MODE,
  DEFAULT_REDACT_PATTERNS,
  redactToolDetail,
} from "./identifiers.js";

export type { RedactOptions, RedactSensitiveMode };

const requireConfig = resolveNodeRequireFromMeta(import.meta.url);

function normalizeMode(value?: string): RedactSensitiveMode {
  return value === "off" ? "off" : DEFAULT_REDACT_MODE;
}

function resolveConfigRedaction(): RedactOptions {
  let cfg: OpenClawConfig["logging"] | undefined;
  try {
    const loaded = requireConfig?.("../config/config.js") as
      | {
          loadConfig?: () => OpenClawConfig;
        }
      | undefined;
    cfg = loaded?.loadConfig?.().logging;
  } catch {
    cfg = undefined;
  }
  return {
    mode: normalizeMode(cfg?.redactSensitive),
    patterns: cfg?.redactPatterns,
  };
}

/**
 * High-level redaction that attempts to resolve application config.
 * For a lightweight version, use identifiers.js directly.
 */
export function redactSensitiveText(text: string, options?: RedactOptions): string {
  if (!text) {
    return text;
  }
  const resolved = options ?? resolveConfigRedaction();
  return lightweightRedact(text, resolved);
}

export function getDefaultRedactPatterns(): string[] {
  return [...DEFAULT_REDACT_PATTERNS];
}

