import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key Validation", () => {
  it("should have RESEND_API_KEY configured", () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY!.length).toBeGreaterThan(0);
  });

  it("should be able to initialize Resend client and list domains", async () => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Use a lightweight API call to validate the key
    const { data, error } = await resend.domains.list();
    // If the key is valid, we should get data (even if empty) and no auth error
    if (error) {
      // 403 or 401 means invalid key
      expect(error.message).not.toContain("API key is invalid");
      expect(error.message).not.toContain("Unauthorized");
    }
    // If no error, key is valid
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
