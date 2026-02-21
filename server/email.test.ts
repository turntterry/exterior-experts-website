import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Resend before importing the module
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe("Email Notifications", () => {
  const originalEnv = process.env.RESEND_API_KEY;

  beforeEach(() => {
    vi.resetModules();
    mockSend.mockReset();
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.RESEND_API_KEY = originalEnv;
    } else {
      delete process.env.RESEND_API_KEY;
    }
  });

  describe("sendQuoteNotificationEmail", () => {
    it("returns false when RESEND_API_KEY is not set", async () => {
      delete process.env.RESEND_API_KEY;
      // Re-import to get fresh module state
      const { sendQuoteNotificationEmail } = await import("./email");
      const result = await sendQuoteNotificationEmail({
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "555-1234",
        address: "123 Main St, Cookeville, TN",
        services: [{ name: "House Washing", price: 300 }],
        subtotal: 300,
        bundleDiscount: 0,
        travelFee: 0,
        totalPrice: 300,
        quoteId: 1,
      });
      expect(result).toBe(false);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sends email with correct data when API key is set", async () => {
      process.env.RESEND_API_KEY = "re_test_123";
      mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });
      const { sendQuoteNotificationEmail } = await import("./email");

      const result = await sendQuoteNotificationEmail({
        customerName: "Jane Smith",
        customerEmail: "jane@example.com",
        customerPhone: "555-5678",
        address: "456 Oak Ave, Cookeville, TN",
        services: [
          { name: "House Washing", price: 300 },
          { name: "Window Cleaning", price: 250 },
        ],
        subtotal: 550,
        bundleDiscount: 55,
        travelFee: 0,
        totalPrice: 495,
        preferredDate: "2026-03-15",
        preferredTime: "Morning",
        quoteId: 42,
      });

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.to).toEqual(["randall@exteriorexperts.co"]);
      expect(callArgs.subject).toContain("$495.00");
      expect(callArgs.subject).toContain("Jane Smith");
      expect(callArgs.html).toContain("House Washing");
      expect(callArgs.html).toContain("Window Cleaning");
      expect(callArgs.html).toContain("$55.00"); // bundle discount
    });

    it("returns false when Resend returns an error", async () => {
      process.env.RESEND_API_KEY = "re_test_123";
      mockSend.mockResolvedValue({ data: null, error: { message: "Invalid API key" } });
      const { sendQuoteNotificationEmail } = await import("./email");

      const result = await sendQuoteNotificationEmail({
        customerName: "Test",
        customerEmail: "test@test.com",
        customerPhone: "555-0000",
        address: "789 Elm St",
        services: [{ name: "Roof Cleaning", price: 400 }],
        subtotal: 400,
        bundleDiscount: 0,
        travelFee: 0,
        totalPrice: 400,
        quoteId: 99,
      });
      expect(result).toBe(false);
    });

    it("returns false when Resend throws an exception", async () => {
      process.env.RESEND_API_KEY = "re_test_123";
      mockSend.mockRejectedValue(new Error("Network error"));
      const { sendQuoteNotificationEmail } = await import("./email");

      const result = await sendQuoteNotificationEmail({
        customerName: "Test",
        customerEmail: "test@test.com",
        customerPhone: "555-0000",
        address: "789 Elm St",
        services: [{ name: "Deck Cleaning", price: 200 }],
        subtotal: 200,
        bundleDiscount: 0,
        travelFee: 0,
        totalPrice: 200,
        quoteId: 100,
      });
      expect(result).toBe(false);
    });
  });

  describe("sendContactNotificationEmail", () => {
    it("returns false when RESEND_API_KEY is not set", async () => {
      delete process.env.RESEND_API_KEY;
      const { sendContactNotificationEmail } = await import("./email");
      const result = await sendContactNotificationEmail({
        name: "Bob",
        email: "bob@example.com",
        contactId: 1,
      });
      expect(result).toBe(false);
    });

    it("sends contact email with correct data", async () => {
      process.env.RESEND_API_KEY = "re_test_123";
      mockSend.mockResolvedValue({ data: { id: "email_456" }, error: null });
      const { sendContactNotificationEmail } = await import("./email");

      const result = await sendContactNotificationEmail({
        name: "Alice Johnson",
        email: "alice@example.com",
        phone: "555-9999",
        service: "House Washing",
        message: "I'd like a quote for my 2-story home.",
        contactId: 5,
      });

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.to).toEqual(["randall@exteriorexperts.co"]);
      expect(callArgs.subject).toContain("Alice Johnson");
      expect(callArgs.subject).toContain("House Washing");
      expect(callArgs.html).toContain("alice@example.com");
      expect(callArgs.html).toContain("555-9999");
      expect(callArgs.html).toContain("2-story home");
    });
  });
});
