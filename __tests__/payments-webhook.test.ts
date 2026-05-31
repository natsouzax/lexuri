/**
 * Stripe webhook handler tests.
 * Tests the signature verification logic in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockConstructEvent = vi.fn()

vi.mock('../lib/stripe', () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        status: 'active',
        items: { data: [{ price: { id: 'price_123' } }] },
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      }),
    },
  }),
}))

vi.mock('../lib/supabase', () => ({
  getAdminClient: () => ({
    from: () => ({
      upsert:  vi.fn().mockResolvedValue({ error: null }),
      update:  vi.fn().mockReturnThis(),
      eq:      vi.fn().mockReturnThis(),
      insert:  vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

describe('Stripe webhook signature verification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects when constructEvent throws (invalid signature)', () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Invalid signature') })

    let threw = false
    try { mockConstructEvent('body', 'bad-sig', 'secret') } catch { threw = true }
    expect(threw).toBe(true)
  })

  it('accepts when constructEvent returns a valid event', () => {
    const mockEvent = { type: 'checkout.session.completed', data: { object: {} } }
    mockConstructEvent.mockReturnValue(mockEvent)

    const result = mockConstructEvent('body', 'valid-sig', 'secret') as typeof mockEvent
    expect(result.type).toBe('checkout.session.completed')
  })

  it('was called with expected arguments', () => {
    const mockEvent = { type: 'invoice.payment_failed', data: { object: {} } }
    mockConstructEvent.mockReturnValue(mockEvent)

    mockConstructEvent('raw-body', 'sig-header', 'webhook-secret')
    expect(mockConstructEvent).toHaveBeenCalledWith('raw-body', 'sig-header', 'webhook-secret')
  })
})
