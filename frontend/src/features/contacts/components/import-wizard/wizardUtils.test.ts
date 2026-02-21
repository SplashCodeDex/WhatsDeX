import { describe, it, expect } from 'vitest';
import {
    autoMapHeaders,
    validateRow,
    validateAllRows,
    generateSampleCSV,
    parseVCard,
    getValidationStats,
    buildCSVFromValidated,
    initialWizardState,
    type FieldMapping,
    type ValidationResult,
} from './wizardUtils';

// ─── autoMapHeaders ──────────────────────────────────────────────

describe('autoMapHeaders', () => {
    it('maps standard headers correctly', () => {
        const headers = ['Name', 'Phone', 'Email', 'Tags'];
        const mappings = autoMapHeaders(headers, ['John', '+123456789', 'j@x.com', 'vip']);

        expect(mappings).toHaveLength(4);
        expect(mappings[0].targetField).toBe('name');
        expect(mappings[1].targetField).toBe('phone');
        expect(mappings[2].targetField).toBe('email');
        expect(mappings[3].targetField).toBe('tags');
    });

    it('maps Google Contacts headers (case-insensitive)', () => {
        const headers = ['Given Name', 'Phone 1 - Value', 'E-mail 1 - Value', 'Group Membership'];
        const mappings = autoMapHeaders(headers);

        expect(mappings[0].targetField).toBe('name');
        expect(mappings[1].targetField).toBe('phone');
        expect(mappings[2].targetField).toBe('email');
        expect(mappings[3].targetField).toBe('tags');
    });

    it('falls back to value-pattern detection for unknown headers', () => {
        const headers = ['col_a', 'col_b', 'col_c'];
        const firstRow = ['John Doe', '+1234567890', 'john@test.com'];
        const mappings = autoMapHeaders(headers, firstRow);

        expect(mappings[0].targetField).toBe('skip'); // Cannot detect 'name' by value pattern
        expect(mappings[1].targetField).toBe('phone');
        expect(mappings[2].targetField).toBe('email');
    });

    it('handles empty headers array', () => {
        const mappings = autoMapHeaders([]);
        expect(mappings).toHaveLength(0);
    });

    it('maps the first phone column and skips subsequent phone aliases (strict 1-to-1)', () => {
        const headers = ['Phone', 'Mobile'];
        const mappings = autoMapHeaders(headers, ['+123', '+456']);

        expect(mappings[0].targetField).toBe('phone');
        expect(mappings[1].targetField).toBe('skip');
    });

    it('generates fallback column names for empty headers', () => {
        const headers = ['Name', ''];
        const mappings = autoMapHeaders(headers);

        expect(mappings[1].csvHeader).toBe('Column 2');
    });

    it('preserves sampleValue from firstRow', () => {
        const headers = ['Name'];
        const firstRow = ['Alice'];
        const mappings = autoMapHeaders(headers, firstRow);

        expect(mappings[0].sampleValue).toBe('Alice');
    });
});

// ─── validateRow ─────────────────────────────────────────────────

describe('validateRow', () => {
    const baseMappings: readonly FieldMapping[] = [
        { csvIndex: 0, csvHeader: 'Name', targetField: 'name', sampleValue: '' },
        { csvIndex: 1, csvHeader: 'Phone', targetField: 'phone', sampleValue: '' },
        { csvIndex: 2, csvHeader: 'Email', targetField: 'email', sampleValue: '' },
    ];

    it('returns valid when name and phone are present', () => {
        const result = validateRow(['John', '+1234567890', 'j@x.com'], baseMappings);
        expect(result.status).toBe('valid');
        expect(result.row.name).toBe('John');
        expect(result.row.phone).toBe('+1234567890');
    });

    it('returns error when phone is missing', () => {
        const result = validateRow(['John', '', 'j@x.com'], baseMappings);
        expect(result.status).toBe('error');
        expect(result.reason).toContain('phone');
    });

    it('returns warning when name is missing but phone exists', () => {
        const result = validateRow(['', '+1234567890', ''], baseMappings);
        expect(result.status).toBe('warning');
        expect(result.reason).toContain('name');
    });

    it('normalizes phone numbers (strips formatting)', () => {
        const result = validateRow(['John', '+1 (234) 567-890', ''], baseMappings);
        expect(result.row.phone).toBe('+1234567890');
    });

    it('normalizes phone numbers without country code', () => {
        const result = validateRow(['John', '(234) 567-8901', ''], baseMappings);
        expect(result.row.phone).toBe('2345678901');
    });

    it('cleans Google-style tag separators', () => {
        const mappings: readonly FieldMapping[] = [
            ...baseMappings,
            { csvIndex: 3, csvHeader: 'Groups', targetField: 'tags', sampleValue: '' },
        ];
        const result = validateRow(['John', '+123', '', '* myContacts:::friends:::work'], mappings);
        expect(result.row.tags).toBe('friends|work');
    });

    it('concatenates multiple name columns (first + last)', () => {
        const mappings: readonly FieldMapping[] = [
            { csvIndex: 0, csvHeader: 'First', targetField: 'name', sampleValue: '' },
            { csvIndex: 1, csvHeader: 'Last', targetField: 'name', sampleValue: '' },
            { csvIndex: 2, csvHeader: 'Phone', targetField: 'phone', sampleValue: '' },
        ];
        const result = validateRow(['Jane', 'Doe', '+123'], mappings);
        expect(result.row.name).toBe('Jane Doe');
    });

    it('skips columns mapped to "skip"', () => {
        const mappings: readonly FieldMapping[] = [
            { csvIndex: 0, csvHeader: 'Name', targetField: 'name', sampleValue: '' },
            { csvIndex: 1, csvHeader: 'Random', targetField: 'skip', sampleValue: '' },
            { csvIndex: 2, csvHeader: 'Phone', targetField: 'phone', sampleValue: '' },
        ];
        const result = validateRow(['John', 'ignored data', '+123'], mappings);
        expect(result.row).not.toHaveProperty('skip');
        expect(result.row.name).toBe('John');
    });
});

// ─── validateAllRows ────────────────────────────────────────────

describe('validateAllRows', () => {
    const mappings: readonly FieldMapping[] = [
        { csvIndex: 0, csvHeader: 'Name', targetField: 'name', sampleValue: '' },
        { csvIndex: 1, csvHeader: 'Phone', targetField: 'phone', sampleValue: '' },
    ];

    it('skips the header row (index 0)', () => {
        const data = [
            ['Name', 'Phone'],  // Header
            ['John', '+123'],
        ];
        const results = validateAllRows(data, mappings);
        expect(results).toHaveLength(1);
        expect(results[0].row.name).toBe('John');
    });

    it('filters out empty rows', () => {
        const data = [
            ['Name', 'Phone'],
            ['John', '+123'],
            ['', ''],        // Empty row
            ['Jane', '+456'],
        ];
        const results = validateAllRows(data, mappings);
        expect(results).toHaveLength(2);
    });

    it('returns empty array for header-only data', () => {
        const data = [['Name', 'Phone']];
        const results = validateAllRows(data, mappings);
        expect(results).toHaveLength(0);
    });
});

// ─── getValidationStats ──────────────────────────────────────────

describe('getValidationStats', () => {
    it('counts valid, warning, and error rows correctly', () => {
        const results: ValidationResult[] = [
            { status: 'valid', row: { name: 'A', phone: '+1' } },
            { status: 'valid', row: { name: 'B', phone: '+2' } },
            { status: 'warning', reason: 'Missing name', row: { phone: '+3' } },
            { status: 'error', reason: 'No phone', row: { name: 'C' } },
        ];

        const stats = getValidationStats(results);
        expect(stats.total).toBe(4);
        expect(stats.valid).toBe(2);
        expect(stats.warnings).toBe(1);
        expect(stats.errors).toBe(1);
    });

    it('handles empty results', () => {
        const stats = getValidationStats([]);
        expect(stats.total).toBe(0);
        expect(stats.valid).toBe(0);
    });
});

// ─── generateSampleCSV ──────────────────────────────────────────

describe('generateSampleCSV', () => {
    it('generates a valid CSV with header and sample rows', () => {
        const csv = generateSampleCSV();
        const lines = csv.split('\n');

        expect(lines[0]).toBe('name,phone,email,tags');
        expect(lines.length).toBeGreaterThanOrEqual(3);
    });

    it('includes expected sample data', () => {
        const csv = generateSampleCSV();
        expect(csv).toContain('John Doe');
        expect(csv).toContain('+1234567890');
    });
});

// ─── parseVCard ──────────────────────────────────────────────────

describe('parseVCard', () => {
    it('parses a standard vCard with FN, TEL, EMAIL', () => {
        const vcf = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+1234567890
EMAIL:john@example.com
END:VCARD`;

        const result = parseVCard(vcf);
        expect(result[0]).toEqual(['name', 'phone', 'email', 'tags']);
        expect(result[1]).toEqual(['John Doe', '+1234567890', 'john@example.com', '']);
    });

    it('falls back to N field when FN is missing', () => {
        const vcf = `BEGIN:VCARD
VERSION:3.0
N:Doe;Jane;;;
TEL:+9876543210
END:VCARD`;

        const result = parseVCard(vcf);
        expect(result[1][0]).toBe('Jane Doe');
    });

    it('handles multiple vCards in one file', () => {
        const vcf = `BEGIN:VCARD
FN:Alice
TEL:+111
END:VCARD
BEGIN:VCARD
FN:Bob
TEL:+222
END:VCARD`;

        const result = parseVCard(vcf);
        expect(result).toHaveLength(3); // 1 header + 2 contacts
    });

    it('extracts CATEGORIES as tags', () => {
        const vcf = `BEGIN:VCARD
FN:Carol
TEL:+333
CATEGORIES:Friends,Family
END:VCARD`;

        const result = parseVCard(vcf);
        expect(result[1][3]).toBe('Friends|Family');
    });

    it('skips cards with no name and no phone', () => {
        const vcf = `BEGIN:VCARD
VERSION:3.0
EMAIL:orphan@test.com
END:VCARD`;

        const result = parseVCard(vcf);
        expect(result).toHaveLength(1); // Only header, no data rows
    });

    it('handles TEL with type annotations (TEL;TYPE=CELL)', () => {
        const vcf = `BEGIN:VCARD
FN:Dave
TEL;TYPE=CELL:+444
END:VCARD`;

        const result = parseVCard(vcf);
        expect(result[1][1]).toBe('+444');
    });
});

// ─── buildCSVFromValidated ───────────────────────────────────────

describe('buildCSVFromValidated', () => {
    const rows: ValidationResult[] = [
        { status: 'valid', row: { name: 'John', phone: '+123', email: 'j@x.com', tags: 'vip' } },
        { status: 'warning', reason: 'Missing name', row: { name: '', phone: '+456', email: '', tags: '' } },
        { status: 'error', reason: 'No phone', row: { name: 'Ghost', phone: '', email: '', tags: '' } },
    ];

    it('includes header row', () => {
        const csv = buildCSVFromValidated(rows, '', false);
        const lines = csv.split('\n');
        expect(lines[0]).toBe('name,phone,email,tags');
    });

    it('excludes error rows when excludeInvalid is true', () => {
        const csv = buildCSVFromValidated(rows, '', true);
        const lines = csv.split('\n');
        expect(lines).toHaveLength(3); // header + 2 non-error rows
    });

    it('includes all rows when excludeInvalid is false', () => {
        const csv = buildCSVFromValidated(rows, '', false);
        const lines = csv.split('\n');
        expect(lines).toHaveLength(4); // header + 3 rows
    });

    it('uses "Unknown" for missing names', () => {
        const csv = buildCSVFromValidated(rows, '', false);
        expect(csv).toContain('Unknown');
    });

    it('appends import tag to existing tags', () => {
        const csv = buildCSVFromValidated(rows, 'batch-1', true);
        expect(csv).toContain('vip|batch-1');
    });

    it('sets import tag as sole tag when row has no tags', () => {
        const csv = buildCSVFromValidated(rows, 'batch-1', true);
        const lines = csv.split('\n');
        // Warning row (no tags) should have only 'batch-1'
        expect(lines[2]).toContain('batch-1');
    });

    it('escapes values containing commas', () => {
        const commaRows: ValidationResult[] = [
            { status: 'valid', row: { name: 'Doe, John', phone: '+123', email: '', tags: '' } },
        ];
        const csv = buildCSVFromValidated(commaRows, '', false);
        expect(csv).toContain('"Doe, John"');
    });
});

// ─── initialWizardState ──────────────────────────────────────────

describe('initialWizardState', () => {
    it('starts at step 1', () => {
        expect(initialWizardState.step).toBe(1);
    });

    it('has no file selected', () => {
        expect(initialWizardState.file).toBeNull();
    });

    it('defaults to excludeInvalid = true', () => {
        expect(initialWizardState.excludeInvalid).toBe(true);
    });

    it('has empty arrays for data', () => {
        expect(initialWizardState.rawData).toHaveLength(0);
        expect(initialWizardState.mappings).toHaveLength(0);
        expect(initialWizardState.validatedRows).toHaveLength(0);
    });
});
