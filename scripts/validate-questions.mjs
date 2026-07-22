import crypto from "node:crypto";
import fs from "node:fs";

const EXPECTED_CATEGORIES = [
  "Ice Breakers", "Travel", "Funny", "Deep", "Career", "Movies", "Food", "Dreams", "Tech & AI", "Mindset & Habits",
  "Friendship & Relationships", "Would You Rather", "Storytelling", "Culture & Traditions", "Music", "Health & Lifestyle",
  "Education & Learning", "Nature & Environment", "Language & Communication", "Society & the Future",
];
const PREVIOUS_LIBRARY_HASH = "d4ea3daed63615f35efa150158d0765f86c39276b35c43121de23a49b82fe26f";
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
  assert(items.length === 100, `${category}: expected 100 questions; found ${items.length}`);
  assert((levels.beginner?.length ?? 0) === 30, `${category}: expected 30 beginner questions`);
  assert((levels.intermediate?.length ?? 0) === 40, `${category}: expected 40 intermediate questions`);
  assert((levels.advanced?.length ?? 0) === 30, `${category}: expected 30 advanced questions`);
  for (const question of items) all.push({ ...question, category });
}

const globalLevels = Object.groupBy(all, (question) => question.difficulty);
assert(all.length === 2000, `Expected 2,000 questions; found ${all.length}`);
assert((globalLevels.beginner?.length ?? 0) === 600, "Expected 600 beginner questions");
assert((globalLevels.intermediate?.length ?? 0) === 800, "Expected 800 intermediate questions");
assert((globalLevels.advanced?.length ?? 0) === 600, "Expected 600 advanced questions");

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

const previousLibrary = EXPECTED_CATEGORIES.flatMap((category) => bank[category].slice(0, 50).map((question) => ({ ...question, category })));
const previousHash = crypto.createHash("sha256").update(JSON.stringify(previousLibrary)).digest("hex");
assert(previousLibrary.length === 1000, `Expected 1,000 previous questions; found ${previousLibrary.length}`);
assert(previousHash === PREVIOUS_LIBRARY_HASH, "A previous question ID, category, text, or difficulty changed");
const longest = [...all].sort((left, right) => right.text.length - left.text.length)[0];
assert(longest.text.length <= 180, `${longest.id} is excessively long at ${longest.text.length} characters`);

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

console.log("✓ 2,000 questions across 20 categories");
console.log("✓ Every category: 30 beginner, 40 intermediate, 30 advanced");
console.log("✓ Global levels: 600 beginner, 800 intermediate, 600 advanced");
console.log(`✓ ${ids.size} unique IDs and ${normalizedTexts.size} unique normalized texts`);
console.log("✓ All 1,000 previous ID/category/text/difficulty records preserved");
console.log(`✓ Longest question reviewed: ${longest.text.length} characters (${longest.id})`);
console.log(`Near-duplicate review candidates (token containment ≥ 0.80): ${nearDuplicates.length}`);
for (const [left, right, similarity] of nearDuplicates) console.log(`  ${similarity.toFixed(2)}  ${left} <> ${right}`);
