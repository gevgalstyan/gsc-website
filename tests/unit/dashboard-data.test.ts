import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-expect-error Node native TypeScript imports.
import { missingProfileColumns, dataLoadExplanation } from "../../src/lib/profile-schema.ts";
// @ts-expect-error Node native TypeScript imports.
import { loyaltyProgress } from "../../src/lib/loyalty-progress.ts";
// @ts-expect-error Node native TypeScript imports.
import { validateAvatarSource } from "../../src/lib/avatar-image.ts";
test("profile compatibility never masks role, permission, network or missing-table errors",()=>{
  for(const code of ["42703","PGRST204"])assert.equal(missingProfileColumns({code}),true);
  for(const code of ["42501","42P01","PGRST301","PGRST205","500",""])assert.equal(missingProfileColumns({code}),false);
  assert.match(dataLoadExplanation({code:"42501"}),/denied access/);
});
test("loyalty only advances with paid attendance; available rewards keep the free visit unlocked",()=>{
  const visits=[{status:"attended",payment_status:"paid"},{status:"no_show",payment_status:"paid"},{status:"attended",payment_status:"unpaid"},{status:"attended",payment_status:"free_reward"}];
  assert.deepEqual(loyaltyProgress(visits,[{status:"redeemed"}]),{paidVisits:1,availableRewards:0,progress:1});
  assert.equal(loyaltyProgress(visits,[{status:"available"}]).progress,6);
  assert.equal(loyaltyProgress(Array.from({length:7},()=>visits[0]),[]).progress,1);
});
test("photo signatures handle empty/misleading picker MIME and names without trusting extensions",async()=>{
  const jpeg=new File([new Uint8Array([255,216,255,224])],"iphone.HEIC",{type:""});
  assert.equal(await validateAvatarSource(jpeg),"image/jpeg");
  const png=new File([new Uint8Array([137,80,78,71,13,10,26,10])],"photo",{type:""});
  assert.equal(await validateAvatarSource(png),"image/png");
  await assert.rejects(validateAvatarSource(new File(["not an image"],"photo.jpg",{type:"image/jpeg"})),/genuine JPEG/);
});
test("HEIC reaches the browser decoder while empty and oversized files are rejected",async()=>{
  assert.equal(await validateAvatarSource(new File([new Uint8Array([0,0,0,24]),"ftypheic0000"],"photo.heic",{type:"image/heic"})),"image/heic");
  await assert.rejects(validateAvatarSource(new File([],"empty.jpg")),/empty/);
  await assert.rejects(validateAvatarSource(new File([new Uint8Array(20*1024*1024+1)],"large.jpg")),/20 MB/);
});
