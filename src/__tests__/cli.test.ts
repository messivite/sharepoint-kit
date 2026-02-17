import { describe, it, expect } from 'vitest';
import {
  generateFileHeader,
  generateInterface,
  mapSharePointTypeToTs,
  sanitizeInterfaceName,
} from '../cli/templates.js';

describe('templates', () => {
  describe('generateFileHeader', () => {
    it('should include auto-generated comment', () => {
      const header = generateFileHeader();
      expect(header).toContain('Auto-generated');
      expect(header).toContain('@mustafaaksoy/sharepoint-kit');
    });
  });

  describe('generateInterface', () => {
    it('should generate a valid TypeScript interface', () => {
      const result = generateInterface('Invoice', [
        { name: 'Title', tsType: 'string', required: true },
        { name: 'Amount', tsType: 'number', required: false, description: 'Tutar' },
      ]);

      expect(result).toContain('export interface Invoice {');
      expect(result).toContain('  Title: string;');
      expect(result).toContain('  /** Tutar */');
      expect(result).toContain('  Amount?: number;');
      expect(result).toContain('}');
    });

    it('should handle empty fields', () => {
      const result = generateInterface('Empty', []);
      expect(result).toBe('export interface Empty {\n}');
    });
  });

  describe('mapSharePointTypeToTs', () => {
    it('should map Text to string', () => {
      expect(mapSharePointTypeToTs('Text')).toBe('string');
    });

    it('should map Note to string', () => {
      expect(mapSharePointTypeToTs('Note')).toBe('string');
    });

    it('should map Number to number', () => {
      expect(mapSharePointTypeToTs('Number')).toBe('number');
    });

    it('should map Currency to number', () => {
      expect(mapSharePointTypeToTs('Currency')).toBe('number');
    });

    it('should map Boolean to boolean', () => {
      expect(mapSharePointTypeToTs('Boolean')).toBe('boolean');
    });

    it('should map DateTime to string', () => {
      expect(mapSharePointTypeToTs('DateTime')).toBe('string');
    });

    it('should map Lookup to object', () => {
      expect(mapSharePointTypeToTs('Lookup')).toBe('{ id: number; value: string }');
    });

    it('should map User to object', () => {
      expect(mapSharePointTypeToTs('User')).toContain('displayName');
    });

    it('should map Choice to string', () => {
      expect(mapSharePointTypeToTs('Choice')).toBe('string');
    });

    it('should map MultiChoice to string[]', () => {
      expect(mapSharePointTypeToTs('MultiChoice')).toBe('string[]');
    });

    it('should map unknown type to unknown', () => {
      expect(mapSharePointTypeToTs('SomeWeirdType')).toBe('unknown');
    });
  });

  describe('sanitizeInterfaceName', () => {
    it('should remove special characters', () => {
      expect(sanitizeInterfaceName('Fatura Denemesi')).toBe('FaturaDenemesi');
    });

    it('should prefix with underscore if starts with digit', () => {
      expect(sanitizeInterfaceName('123Test')).toBe('_123Test');
    });

    it('should keep valid characters', () => {
      expect(sanitizeInterfaceName('MyType_V2')).toBe('MyType_V2');
    });
  });
});

describe('CacheManager', () => {
  // CacheManager tests use file system so skipped for unit tests
  it.todo('should load and save cache');
  it.todo('should return null for non-existent cache');
  it.todo('should save and retrieve resolutions');
  it.todo('should clear cache');
});

describe('interactive-prompt', () => {
  it.todo('should return first list when strategy is first');
  it.todo('should return all lists when strategy is all');
  it.todo('should throw when strategy is error');
});
