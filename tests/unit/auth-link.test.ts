import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-expect-error Node's test runner strips explicit TypeScript imports.
import { authLinkFailure, isEmailLinkType, validTokenHash } from "../../src/lib/auth-link.ts";
test("supported email link types and complete hashes only", () => {
  for (const type of ["signup","recovery","invite","magiclink","email_change","email"]) assert.equal(isEmailLinkType(type),true);
  assert.equal(isEmailLinkType("reauthentication"),false); // supported as a code, not token_hash
  assert.equal(validTokenHash("a".repeat(64)),true);
  for (const token of ["short","a".repeat(513),"<script>"+"a".repeat(64)]) assert.equal(validTokenHash(token),false);
});
test("missing PKCE storage is diagnosed separately from expired/reused credentials", () => {
  assert.match(authLinkFailure("pkce_code_verifier_not_found"), /browser where you started/);
  assert.match(authLinkFailure("otp_expired"), /expired or has already been used/);
  assert.doesNotMatch(authLinkFailure("access_denied"), /has expired/);
  assert.match(authLinkFailure(undefined,503), /temporarily unavailable/);
  assert.doesNotMatch(authLinkFailure("unexpected secret credential"), /secret credential/);
});
