import { FIELD_ALIASES, type TargetField as SharedTargetField } from '@whatsdex/shared/fieldAliases';
import * as XLSX from 'xlsx';

// ─── Target Fields ────────────────────────────────────────────────
export type TargetField = SharedTargetField;

export interface FieldMapping {
    readonly csvIndex: number;
    readonly csvHeader: string;
    readonly targetField: TargetField;
    readonly sampleValue: string;
}

export interface MappingProfile {
    readonly id: string;
    readonly name: string;
    readonly mappings: Readonly<Record<string, TargetField>>; // csvHeader -> targetField
    readonly createdAt: number;
}

export interface ValidationResult {
    readonly status: 'valid' | 'warning' | 'error';
    readonly reason?: string;
    readonly row: Readonly<Record<string, string>>;
}

export interface WizardState {
    readonly step: number;
    readonly file: File | null;
    readonly fileType: 'csv' | 'vcf' | 'excel' | null;
    readonly rawData: readonly string[][];
    readonly headers: readonly string[];
    readonly mappings: readonly FieldMapping[];
    readonly validatedRows: readonly ValidationResult[];
    readonly importTag: string;
    readonly excludeInvalid: boolean;
}

export const initialWizardState: WizardState = {
    step: 1,
    file: null,
    fileType: null,
    rawData: [],
    headers: [],
    mappings: [],
    validatedRows: [],
    importTag: '',
    excludeInvalid: true,
};

// ─── Header Aliases ───────────────────────────────────────────────
// Now using synchronized FIELD_ALIASES from @whatsdex/shared/fieldAliases
const HEADER_ALIASES = FIELD_ALIASES;

// ─── Auto-Mapping Engine ─────────────────────────────────────────
/**
 * Intelligently matches CSV headers to target contact fields.
 * Uses fuzzy alias matching + value-pattern detection as fallback.
 */
export function autoMapHeaders(
    headers: string[],
    firstRow: string[] = []
): FieldMapping[] {
    const mappings: FieldMapping[] = [];
    const usedTargets = new Set<TargetField>();

    // Phase 1: Direct alias matching
    headers.forEach((header, index) => {
        const normalized = header.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '');
        let matched: TargetField = 'skip';

        for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [TargetField, readonly string[]][]) {
            if (field === 'skip') continue;

            // Strictly enforce one-to-one mapping for phone, email, and tags
            if (field !== 'name' && usedTargets.has(field)) continue;

            if (aliases.some(alias => normalized === alias || normalized.includes(alias))) {
                // For name fields: allow multiple matches (for first+last name detection)
                matched = field;
                break;
            }
        }

        // Phase 2: Value-pattern detection (if no alias match)
        if (matched === 'skip' && firstRow[index]) {
            const value = firstRow[index].trim();
            if (!usedTargets.has('phone') && /^\+?[\d\s\-()]{7,}$/.test(value)) {
                matched = 'phone';
            } else if (!usedTargets.has('email') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                matched = 'email';
            }
        }

        if (matched !== 'skip') {
            usedTargets.add(matched);
        }

        mappings.push({
            csvIndex: index,
            csvHeader: header || `Column ${index + 1}`,
            targetField: matched,
            sampleValue: firstRow[index] || '',
        });
    });

    return mappings;
}

// ─── Row Validation ──────────────────────────────────────────────
/**
 * Validates a single data row against the field mappings.
 * Returns status: valid, warning (missing name), or error (no phone).
 */
export function validateRow(
    row: string[],
    mappings: readonly FieldMapping[]
): ValidationResult {
    const mapped: Record<string, string> = {};

    mappings.forEach((m) => {
        if (m.targetField !== 'skip') {
            const existing = mapped[m.targetField] || '';
            const value = (row[m.csvIndex] || '').trim();
            // Concatenate for name fields (first + last)
            mapped[m.targetField] = existing ? `${existing} ${value}`.trim() : value;
        }
    });

    // Clean tags
    if (mapped.tags) {
        mapped.tags = mapped.tags
            .replace(/:::/g, '|') // Google group membership separator
            .split(/[|;,]/)
            .map(t => t.replace(/\*\s*myContacts/i, '').trim())
            .filter(Boolean)
            .join('|');
    }

    // Normalize phone: strip non-digits except leading +
    if (mapped.phone) {
        const raw = mapped.phone;
        mapped.phone = raw.startsWith('+')
            ? '+' + raw.slice(1).replace(/\D/g, '')
            : raw.replace(/\D/g, '');
    }

    // Determine validation status
    if (!mapped.phone) {
        return { status: 'error', reason: 'No phone number', row: mapped };
    }
    if (!mapped.name) {
        return { status: 'warning', reason: 'Missing name (will use "Unknown")', row: mapped };
    }

    return { status: 'valid', row: mapped };
}

// ─── Batch Validation ────────────────────────────────────────────
export function validateAllRows(
    data: readonly string[][],
    mappings: readonly FieldMapping[]
): ValidationResult[] {
    // Skip header row (index 0)
    return data.slice(1).filter(row => row.some(cell => cell.trim())).map(row => validateRow(row, mappings));
}

// ─── Sample CSV Generator ────────────────────────────────────────
export function generateSampleCSV(): string {
    const lines = [
        'name,phone,email,tags',
        'John Doe,+1234567890,john@example.com,customer|vip',
        'Jane Smith,+0987654321,jane@example.com,lead',
        'Bob Wilson,+1122334455,,prospect|warm',
    ];
    return lines.join('\n');
}

export function downloadSampleCSV() {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'whatsdex-contacts-template.csv';
    link.click();
    URL.revokeObjectURL(url);
}

// ─── vCard Parser ────────────────────────────────────────────────
/**
 * Parses .vcf (vCard) files into a 2D array matching CSV format.
 * Returns [headers, ...rows] structure.
 */
export function parseVCard(text: string): string[][] {
    const cards = text.split(/(?=BEGIN:VCARD)/i).filter(c => c.trim());
    const headers = ['name', 'phone', 'email', 'tags'];
    const rows: string[][] = [headers];

    cards.forEach(card => {
        const lines = card.split(/\r?\n/);
        let name = '';
        let phone = '';
        let email = '';
        const tags: string[] = [];

        lines.forEach(line => {
            const upper = line.toUpperCase();

            // Full Name
            if (upper.startsWith('FN:') || upper.startsWith('FN;')) {
                name = line.split(':').slice(1).join(':').trim();
            }
            // Structured Name fallback (Last;First;Middle;Prefix;Suffix)
            else if (!name && (upper.startsWith('N:') || upper.startsWith('N;'))) {
                const parts = line.split(':').slice(1).join(':').split(';');
                name = `${parts[1] || ''} ${parts[0] || ''}`.trim();
            }
            // Phone
            else if (upper.startsWith('TEL:') || upper.startsWith('TEL;')) {
                if (!phone) {
                    phone = line.split(':').slice(1).join(':').trim();
                }
            }
            // Email
            else if (upper.startsWith('EMAIL:') || upper.startsWith('EMAIL;')) {
                if (!email) {
                    email = line.split(':').slice(1).join(':').trim();
                }
            }
            // Categories
            else if (upper.startsWith('CATEGORIES:') || upper.startsWith('CATEGORIES;')) {
                const cats = line.split(':').slice(1).join(':').split(',').map(t => t.trim());
                tags.push(...cats);
            }
        });

        if (name || phone) {
            rows.push([name, phone, email, tags.join('|')]);
        }
    });

    return rows;
}

// ─── Excel Parser ────────────────────────────────────────────────
/**
 * Parses .xlsx or .xls files into a 2D array.
 * Reads only the first worksheet.
 */
export async function parseExcel(file: File): Promise<string[][]> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) return [];

    // Convert to 2D array (header: 1 ensures it returns string[][])
    // We clean up nulls/undefined to empty strings
    const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    return json.map(row =>
        row.map(cell => cell === null || cell === undefined ? '' : String(cell))
    );
}

// ─── Mapping Profile Persistence ──────────────────────────────
const STORAGE_KEY = 'whatsdex:mapping-profiles';

export function getMappingProfiles(): MappingProfile[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function saveMappingProfile(name: string, mappings: readonly FieldMapping[]): MappingProfile {
    const profiles = getMappingProfiles();

    // Convert FieldMappings to a simpler map
    const mappingMap: Record<string, TargetField> = {};
    mappings.forEach(m => {
        if (m.targetField !== 'skip') {
            mappingMap[m.csvHeader] = m.targetField;
        }
    });

    const newProfile: MappingProfile = {
        id: crypto.randomUUID(),
        name,
        mappings: mappingMap,
        createdAt: Date.now(),
    };

    const updated = [newProfile, ...profiles];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newProfile;
}

export function deleteMappingProfile(id: string): void {
    const profiles = getMappingProfiles();
    const updated = profiles.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function findMatchingProfile(headers: readonly string[]): MappingProfile | null {
    const profiles = getMappingProfiles();
    const headerSet = new Set(headers.map(h => h.trim().toLowerCase()));

    return profiles.find(profile => {
        const profileHeaders = Object.keys(profile.mappings).map(h => h.trim().toLowerCase());
        // Simple heuristic: if all mapped headers in profile exist in current file
        return profileHeaders.length > 0 && profileHeaders.every(h => headerSet.has(h));
    }) || null;
}

// ─── Stats Helper ────────────────────────────────────────────────
export function getValidationStats(results: readonly ValidationResult[]): {
    readonly total: number;
    readonly valid: number;
    readonly warnings: number;
    readonly errors: number;
} {
    return {
        total: results.length,
        valid: results.filter(r => r.status === 'valid').length,
        warnings: results.filter(r => r.status === 'warning').length,
        errors: results.filter(r => r.status === 'error').length,
    };
}

// ─── Build CSV from validated rows ───────────────────────────────
/**
 * Converts validated rows back into a CSV string for the backend.
 * Adds the import tag to each row's tags if specified.
 */
export function buildCSVFromValidated(
    rows: readonly ValidationResult[],
    importTag: string,
    excludeInvalid: boolean
): string {
    const filtered = excludeInvalid
        ? rows.filter(r => r.status !== 'error')
        : rows;

    const header = 'name,phone,email,tags';
    const dataLines = filtered.map(r => {
        const tags = [r.row.tags, importTag].filter(Boolean).join('|');
        return [
            csvEscape(r.row.name || 'Unknown'),
            csvEscape(r.row.phone || ''),
            csvEscape(r.row.email || ''),
            csvEscape(tags),
        ].join(',');
    });

    return [header, ...dataLines].join('\n');
}

function csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
