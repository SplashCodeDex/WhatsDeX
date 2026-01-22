import { describe, it, expect } from 'vitest';
import { ContactSchema, AudienceSchema } from './contracts';

describe('ContactSchema', () => {
  // Test case for a valid contact object
  it('should validate a correct contact object', () => {
    const contact = {
      name: 'Jane Doe',
      phone: '0987654321',
      email: 'jane.doe@example.com',
      isSubscribed: true,
    };
    const result = ContactSchema.safeParse(contact);
    expect(result.success).toBe(true);
  });

  // Test case for a contact with optional fields missing
  it('should validate a contact with optional fields missing', () => {
    const contact = {
      name: 'John Doe',
      phone: '1234567890',
    };
    const result = ContactSchema.safeParse(contact);
    expect(result.success).toBe(true);
  });

  // Test case for an invalid contact object (empty name)
  it('should invalidate a contact with an empty name', () => {
    const contact = {
      name: '',
      phone: '1234567890',
    };
    const result = ContactSchema.safeParse(contact);
    expect(result.success).toBe(false);
  });

  // Test case for an invalid contact object (short phone number)
  it('should invalidate a contact with a short phone number', () => {
    const contact = {
      name: 'John Doe',
      phone: '123',
    };
    const result = ContactSchema.safeParse(contact);
    expect(result.success).toBe(false);
  });

  // Test case for an invalid email format
  it('should invalidate a contact with an invalid email', () => {
    const contact = {
      name: 'John Doe',
      phone: '1234567890',
      email: 'not-an-email',
    };
    const result = ContactSchema.safeParse(contact);
    expect(result.success).toBe(false);
  });

  // Test case for default value of isSubscribed
  it('should default isSubscribed to true if not provided', () => {
    const contact = {
      name: 'John Doe',
      phone: '1234567890',
    };
    const result = ContactSchema.safeParse(contact);
    if (result.success) {
      expect(result.data.isSubscribed).toBe(true);
    }
  });
});

describe('AudienceSchema', () => {
  // Test case for a valid audience object
  it('should validate a correct audience object', () => {
    const audience = {
      name: 'Newsletter Subscribers',
      description: 'All users subscribed to the weekly newsletter.',
      contacts: ['contactId1', 'contactId2'],
    };
    const result = AudienceSchema.safeParse(audience);
    expect(result.success).toBe(true);
  });

  // Test case for an audience with optional fields missing
  it('should validate an audience with optional fields missing', () => {
    const audience = {
      name: 'Early Adopters',
    };
    const result = AudienceSchema.safeParse(audience);
    expect(result.success).toBe(true);
  });

  // Test case for an invalid audience (empty name)
  it('should invalidate an audience with an empty name', () => {
    const audience = {
      name: '',
    };
    const result = AudienceSchema.safeParse(audience);
    expect(result.success).toBe(false);
  });

  // Test case for default value of contacts
  it('should default contacts to an empty array if not provided', () => {
    const audience = {
      name: 'New Audience',
    };
    const result = AudienceSchema.safeParse(audience);
    if (result.success) {
      expect(result.data.contacts).toEqual([]);
    }
  });
});
