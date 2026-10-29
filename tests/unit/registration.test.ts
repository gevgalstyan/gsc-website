import assert from "node:assert/strict";
import { test } from "node:test";
// Node 24 strips TypeScript for these dependency-free validation tests.
// @ts-expect-error Node's native test runner uses explicit TypeScript extensions.
import { validateRegistration, NATIONALITIES } from "../../src/lib/registration.ts";
const good = { first_name: "Անի", surname: "O’Connor", age: "0", nationality: "Armenia", gender: "Prefer not to say", email: "member@example.com", password: "long-enough", confirmation: "long-enough", agreement: true };
test("separate Unicode names, no minimum age and requested privacy option", () => assert.deepEqual(validateRegistration(good), {}));
test("requires every requested registration field", () => {
  const errors = validateRegistration({ ...good, first_name: " ", surname: "", age: "", nationality: "", gender: "", email: "bad", password: "short", confirmation: "different", agreement: false });
  assert.equal(Object.keys(errors).length, 9);
});
test("rejects negative, fractional, malformed, and overflowing ages", () => {
  for (const age of ["-1", "4.2", "3years", "Infinity", "2147483648"]) assert.ok(validateRegistration({ ...good, age }).age);
});
test("validates nationality and gender against available options", () => {
  assert.ok(NATIONALITIES.includes("Russia"));
  assert.ok(validateRegistration({ ...good, nationality: "made up" }).nationality);
  assert.ok(validateRegistration({ ...good, gender: "admin" }).gender);
});
test("email length and whitespace are checked, passwords are not trimmed", () => {
  assert.ok(validateRegistration({ ...good, email: "a b@example.com" }).email);
  assert.ok(validateRegistration({ ...good, password: "1234567", confirmation: "1234567" }).password);
  assert.deepEqual(validateRegistration({ ...good, password: " spaces accepted ", confirmation: " spaces accepted " }), {});
});
