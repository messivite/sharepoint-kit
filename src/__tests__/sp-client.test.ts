import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpClient } from '../client/sp-client.js';
import { SpAuthError, SpNotFoundError, SpThrottleError } from '../client/errors.js';

const mockToken = 'mock-token-123';
const mockGetAccessToken = vi.fn().mockResolvedValue(mockToken);

function createMockClient() {
  return createSpClient({
    siteId: 'test-site',
    getAccessToken: mockGetAccessToken,
    retryOptions: { maxRetries: 1, baseDelay: 10, maxDelay: 50 },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockGetAccessToken.mockResolvedValue(mockToken);
});

describe('createSpClient', () => {
  describe('getListItems', () => {
    it('should fetch list items', async () => {
      const mockResponse = {
        value: [
          { id: '1', fields: { Title: 'Item 1', Amount: 100 }, createdDateTime: '2024-01-01' },
          { id: '2', fields: { Title: 'Item 2', Amount: 200 }, createdDateTime: '2024-01-02' },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const client = createMockClient();
      const items = await client.getListItems({ listId: 'list-1' });

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe('1');
      expect(items[0].fields.Title).toBe('Item 1');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sites/test-site/lists/list-1/items'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        }),
      );
    });

    it('should apply content type filter', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ value: [] }),
      } as Response);

      const client = createMockClient();
      await client.getListItems({
        listId: 'list-1',
        contentTypeName: 'Invoice',
      });

      const url = decodeURIComponent(
        ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string).replace(/\+/g, ' '),
      );
      expect(url).toContain("fields/ContentType/Name eq 'Invoice'");
    });
  });

  describe('getItem', () => {
    it('should fetch a single item', async () => {
      const mockItem = { id: '5', fields: { Title: 'Test' } };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockItem),
      } as Response);

      const client = createMockClient();
      const item = await client.getItem({ listId: 'list-1', itemId: '5' });

      expect(item.id).toBe('5');
      expect(item.fields.Title).toBe('Test');
    });
  });

  describe('createItem', () => {
    it('should create an item', async () => {
      const mockItem = { id: '10', fields: { Title: 'New', Amount: 500 } };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockItem),
      } as Response);

      const client = createMockClient();
      const result = await client.createItem({
        listId: 'list-1',
        fields: { Title: 'New', Amount: 500 },
      });

      expect(result.id).toBe('10');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('deleteItem', () => {
    it('should delete an item', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve(undefined),
      } as Response);

      const client = createMockClient();
      await client.deleteItem({ listId: 'list-1', itemId: '5' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/5'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('error handling', () => {
    it('should throw SpAuthError on 401', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: () => Promise.resolve({
          error: { code: 'Unauthorized', message: 'Invalid token' },
        }),
      } as Response);

      const client = createMockClient();
      await expect(client.getListItems({ listId: 'list-1' })).rejects.toThrow(SpAuthError);
    });

    it('should throw SpNotFoundError on 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: () => Promise.resolve({
          error: { code: 'ItemNotFound', message: 'Not found' },
        }),
      } as Response);

      const client = createMockClient();
      await expect(client.getItem({ listId: 'list-1', itemId: '999' })).rejects.toThrow(SpNotFoundError);
    });

    it('should retry on 429 throttle', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'Retry-After': '1' }),
          json: () => Promise.resolve({
            error: { code: 'TooManyRequests', message: 'Throttled' },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ value: [{ id: '1', fields: {} }] }),
        } as Response);

      const client = createMockClient();
      const items = await client.getListItems({ listId: 'list-1' });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(items).toHaveLength(1);
    });

    it('should throw SpThrottleError after max retries', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'Retry-After': '1' }),
        json: () => Promise.resolve({
          error: { code: 'TooManyRequests', message: 'Throttled' },
        }),
      } as Response);

      const client = createMockClient();
      await expect(client.getListItems({ listId: 'list-1' })).rejects.toThrow(SpThrottleError);
    });
  });

  describe('getLists', () => {
    it('should fetch all lists', async () => {
      const mockResponse = {
        value: [
          { id: 'l1', displayName: 'List 1', name: 'List1' },
          { id: 'l2', displayName: 'List 2', name: 'List2' },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const client = createMockClient();
      const lists = await client.getLists();

      expect(lists).toHaveLength(2);
      expect(lists[0].displayName).toBe('List 1');
    });
  });
});
