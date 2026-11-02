import {test} from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Node's test runner strips explicit TypeScript imports.
import {isPrivacyProtectionEnabled,privacyRequestBlocked} from '../../src/lib/privacy-protection.ts';
test('privacy mode fails closed and guards collection without breaking login/recovery',()=>{
 for(const value of [undefined,'','enabled','false','DISABLED']) assert.equal(isPrivacyProtectionEnabled(value),true);
 assert.equal(isPrivacyProtectionEnabled('disabled'),false);
 for(const path of ['/auth/v1/signup','/auth/v1/signup/','/auth/v1/otp'])assert.equal(privacyRequestBlocked(path,'POST',true),true);
 for(const method of ['POST','PUT','post'])assert.equal(privacyRequestBlocked('/rest/v1/meetup_bookings',method,true),true);
 for(const path of ['/auth/v1/token','/auth/v1/recover','/auth/v1/verify','/auth/v1/user','/auth/v1/logout'])assert.equal(privacyRequestBlocked(path,'POST',true),false);
 assert.equal(privacyRequestBlocked('/rest/v1/meetup_bookings','PATCH',true),false);
 assert.equal(privacyRequestBlocked('/auth/v1/signup','POST',false),false);
});
