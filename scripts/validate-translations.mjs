import crypto from "node:crypto";
import fs from "node:fs";

const EXPECTED_ENGLISH_HASH = "dc18d9559a612a6a1f12e095618164a39cb236d29948642ca959ac37253435e2";
const bank = JSON.parse(fs.readFileSync("src/data/questions.json", "utf8"));
const all = Object.entries(bank).flatMap(([category, items]) => items.map((question) => ({ ...question, category })));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const englishRecords = all.map(({ id, category, text, difficulty }) => ({ id, category, text, difficulty }));
const englishHash = crypto.createHash("sha256").update(JSON.stringify(englishRecords)).digest("hex");
const translated = all.filter((question) => Object.hasOwn(question, "translations"));
const iceBreakers = bank["Ice Breakers"] ?? [];
const otherQuestions = all.filter((question) => question.category !== "Ice Breakers");

assert(all.length === 2000, `Expected 2,000 total questions; found ${all.length}`);
assert(iceBreakers.length === 100, `Expected 100 Ice Breakers; found ${iceBreakers.length}`);
assert(translated.length === 100, `Expected exactly 100 translated questions; found ${translated.length}`);
assert(otherQuestions.length === 1900, `Expected 1,900 questions outside Ice Breakers; found ${otherQuestions.length}`);
assert(otherQuestions.every((question) => !Object.hasOwn(question, "translations")), "A non-Ice Breakers question has a translation placeholder");
assert(englishHash === EXPECTED_ENGLISH_HASH, "An existing English ID, category, text, or difficulty changed");

for (const question of iceBreakers) {
  const russian = question.translations?.ru;
  assert(typeof russian === "string" && russian.trim().length > 0, `${question.id} has no Russian translation`);
  if (typeof russian !== "string") continue;
  assert(russian.trim() !== question.text.trim(), `${question.id} has a translation identical to its English source`);
  assert(/[А-Яа-яЁё]/u.test(russian), `${question.id} has no Russian Cyrillic characters`);
  assert(!russian.includes("�"), `${question.id} contains an invalid Unicode replacement character`);
}

const levelCounts = Object.groupBy(all, (question) => question.difficulty);
assert((levelCounts.beginner?.length ?? 0) === 600, "Expected 600 beginner questions");
assert((levelCounts.intermediate?.length ?? 0) === 800, "Expected 800 intermediate questions");
assert((levelCounts.advanced?.length ?? 0) === 600, "Expected 600 advanced questions");

const longest = [...iceBreakers].sort((left, right) =>
  (right.text.length + right.translations.ru.length) - (left.text.length + left.translations.ru.length),
)[0];

if (failures.length) {
  console.error(failures.map((failure) => `✗ ${failure}`).join("\n"));
  process.exit(1);
}

console.log("✓ 2,000 questions remain; English IDs, text, categories, and levels are unchanged");
console.log("✓ All 100 Ice Breakers have non-empty, distinct Russian translations");
console.log("✓ Exactly 100 questions have translations; the other 1,900 have no placeholder");
console.log("✓ Russian Cyrillic Unicode is valid");
console.log("✓ Global levels remain 600 beginner, 800 intermediate, 600 advanced");
console.log(`✓ Longest combined entry reviewed: ${longest.id} (${longest.text.length + longest.translations.ru.length} characters)`);
