import crypto from "node:crypto";
import fs from "node:fs";

const EXPECTED_CATEGORIES = [
  "Ice Breakers", "Travel", "Funny", "Deep", "Career", "Movies", "Food", "Dreams", "Tech & AI", "Mindset & Habits",
  "Friendship & Relationships", "Would You Rather", "Storytelling", "Culture & Traditions", "Music", "Health & Lifestyle",
  "Education & Learning", "Nature & Environment", "Language & Communication", "Society & the Future",
];
const ORIGINAL_COUNTS = {
  "Ice Breakers": 30, Travel: 30, Funny: 30, Deep: 30, Career: 30, Movies: 30, Food: 30, Dreams: 30,
  "Tech & AI": 12, "Mindset & Habits": 10,
};
const ORIGINAL_HASH = "04c3316643ac00519f68b6880fb3a41c465c141034ed2727af9d2433952aeddd";
const VALID_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const bank = JSON.parse(fs.readFileSync("src/data/questions.json", "utf8"));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const normalize = (text) => text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

assert(Object.keys(bank).length === 20, `Expected 20 categories; found ${Object.keys(bank).length}`);
assert(JSON.stringify(Object.keys(bank)) === JSON.stringify(EXPECTED_CATEGORIES), "Category names or ordering differ from the required library");

const all = [];
for (const category of EXPECTED_CATEGORIES) {
  const items = bank[category] ?? [];
  const levels = Object.groupBy(items, (question) => question.difficulty);
  assert(items.length === 50, `${category}: expected 50 questions; found ${items.length}`);
  assert((levels.beginner?.length ?? 0) === 15, `${category}: expected 15 beginner questions`);
  assert((levels.intermediate?.length ?? 0) === 20, `${category}: expected 20 intermediate questions`);
  assert((levels.advanced?.length ?? 0) === 15, `${category}: expected 15 advanced questions`);
  for (const question of items) all.push({ ...question, category });
}

const globalLevels = Object.groupBy(all, (question) => question.difficulty);
assert(all.length === 1000, `Expected 1,000 questions; found ${all.length}`);
assert((globalLevels.beginner?.length ?? 0) === 300, "Expected 300 beginner questions");
assert((globalLevels.intermediate?.length ?? 0) === 400, "Expected 400 intermediate questions");
assert((globalLevels.advanced?.length ?? 0) === 300, "Expected 300 advanced questions");

const ids = new Set();
const normalizedTexts = new Map();
for (const question of all) {
  assert(typeof question.id === "string" && question.id.length > 0, `Question has an invalid ID in ${question.category}`);
  assert(!ids.has(question.id), `Duplicate ID: ${question.id}`);
  ids.add(question.id);
  assert(typeof question.text === "string" && question.text.trim().length > 0, `Empty text: ${question.id}`);
  assert(EXPECTED_CATEGORIES.includes(question.category), `Invalid category: ${question.category}`);
  assert(VALID_LEVELS.has(question.difficulty), `Invalid difficulty: ${question.id}`);
  const normalized = normalize(question.text);
  assert(!normalizedTexts.has(normalized), `Exact normalized duplicate: ${question.id} and ${normalizedTexts.get(normalized)}`);
  normalizedTexts.set(normalized, question.id);
}

const originals = Object.entries(ORIGINAL_COUNTS).flatMap(([category, count]) =>
  bank[category].slice(0, count).map((question, index) => ({ id: `${category}-${index}`, category, text: question.text })),
);
const originalHash = crypto.createHash("sha256").update(JSON.stringify(originals)).digest("hex");
assert(originals.length === 262, `Expected 262 original questions; found ${originals.length}`);
assert(originalHash === ORIGINAL_HASH, "Original question IDs, categories, or text changed");

const tokenSet = (text) => new Set(normalize(text).split(" ").filter((word) => word.length > 3));
const nearDuplicates = [];
for (let left = 0; left < all.length; left += 1) {
  const a = tokenSet(all[left].text);
  for (let right = left + 1; right < all.length; right += 1) {
    const b = tokenSet(all[right].text);
    const intersection = [...a].filter((token) => b.has(token)).length;
    const similarity = intersection / Math.max(a.size, b.size);
    if (similarity >= 0.8 && Math.min(a.size, b.size) >= 5) nearDuplicates.push([all[left].id, all[right].id, similarity]);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `✗ ${failure}`).join("\n"));
  process.exit(1);
}

console.log("✓ 1,000 questions across 20 categories");
console.log("✓ Every category: 15 beginner, 20 intermediate, 15 advanced");
console.log("✓ Global levels: 300 beginner, 400 intermediate, 300 advanced");
console.log(`✓ ${ids.size} unique IDs and ${normalizedTexts.size} unique normalized texts`);
console.log("✓ All 262 original ID/category/text records preserved");
console.log(`Near-duplicate review candidates (token containment ≥ 0.80): ${nearDuplicates.length}`);
for (const [left, right, similarity] of nearDuplicates) console.log(`  ${similarity.toFixed(2)}  ${left} <> ${right}`);

