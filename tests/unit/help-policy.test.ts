import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-expect-error Native Node TypeScript import.
import { faqItems, faqCategories } from "../../src/lib/faq-data.ts";
// @ts-expect-error Native Node TypeScript import.
import { legalDocuments } from "../../src/lib/legal-data.ts";
// @ts-expect-error Native Node TypeScript import.
import { isAvailableReward } from "../../src/lib/loyalty-progress.ts";
test("every authored FAQ has a stable unique ID and complete Russian counterpart",()=>{
 assert.equal(faqItems.length,53);assert.equal(new Set(faqItems.map(item=>item.id)).size,faqItems.length);
 for(const key of ["question","answer"] as const)assert.equal(new Set(faqItems.map(item=>item[key].toLowerCase())).size,faqItems.length);
 for(const category of faqCategories)assert.ok(faqItems.some(item=>item.category===category));
 for(const item of faqItems){assert.match(item.id,/^[a-z0-9-]+$/);assert.match(item.ru.question,/[А-Яа-яЁё]/);assert.match(item.ru.answer,/[А-Яа-яЁё]/);for(const link of item.links??[])assert.ok(link.labelRu&&link.href.startsWith('/'));}
});
test("legal drafts pair every paragraph and cannot silently acquire an effective date",()=>{
 for(const document of Object.values(legalDocuments)){
  assert.equal(document.status,"review-draft");assert.equal(document.effectiveDate,null);assert.ok(document.reviewIssues.length);
  assert.equal(new Set(document.sections.map(section=>section.id)).size,document.sections.length);
  for(const section of document.sections){assert.equal(section.paragraphs.length,section.paragraphsRu.length);assert.match(section.titleRu,/[А-Яа-яЁё]/);for(const paragraph of section.paragraphsRu)assert.match(paragraph,/[А-Яа-яЁё]/);}
 }
});
test("reward display respects the database expiry boundary without changing records",()=>{
 const now=Date.parse('2026-11-01T00:00:00Z');assert.equal(isAvailableReward({status:'available',expires_at:null},now),true);
 assert.equal(isAvailableReward({status:'available',expires_at:'2026-11-02T00:00:00Z'},now),true);
 for(const expiry of ['2026-11-01T00:00:00Z','2026-10-31T23:59:59Z','invalid'])assert.equal(isAvailableReward({status:'available',expires_at:expiry},now),false);
 assert.equal(isAvailableReward({status:'redeemed',expires_at:null},now),false);
});
