import { describe, it, expect } from "vitest";
import { assertSelectMoodPolicy } from "../src/commands/guest-select-mood/policies.js";
import { SelectMoodPolicyError } from "../src/commands/guest-select-mood/errors.js";

describe("Domain Policies: Select Mood", () => {
  it("should pass when mood is valid and session is active", () => {
    // Act & Assert (Should not throw)
    expect(() => 
      assertSelectMoodPolicy({ 
          commandType: "guest.select_mood", 
          tenantId: "tenant_1", 
          sessionId: "session_1", 
          payload: { mood: "deep_relaxation" as any } 
      } as any)
    ).not.toThrow();
  });

  it("should throw PolicyError when tenant is missing", () => {
    expect(() => 
      assertSelectMoodPolicy({ 
          commandType: "guest.select_mood", 
          sessionId: "session_1", 
          payload: { mood: "invalid_mood" as any } 
      } as any)
    ).toThrowError(SelectMoodPolicyError);
    
    expect(() => 
      assertSelectMoodPolicy({ 
          commandType: "guest.select_mood", 
          sessionId: "session_1", 
          payload: { mood: "invalid_mood" as any } 
      } as any)
    ).toThrowError(/tenantId is required/);
  });

  it("should throw PolicyError when session is missing", () => {
    expect(() => 
      assertSelectMoodPolicy({ 
          commandType: "guest.select_mood", 
          tenantId: "tenant_1", 
          payload: { mood: "recovery" as any } 
      } as any)
    ).toThrowError(/sessionId is required/);
  });
});
