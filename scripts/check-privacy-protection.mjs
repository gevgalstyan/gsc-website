// Read-only. Does not create accounts, change Auth configuration or reveal settings values.
const origin=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
console.log('Application mode:',process.env.NEXT_PUBLIC_PRIVACY_PROTECTION_MODE === 'disabled' ? 'OPEN' : 'PROTECTED (requires rebuilt deployment)');
console.log('Required owner-approved Auth configuration: {"disable_signup":true}');
console.log('Required owner-reviewed booking operation: supabase/operations/privacy-protection-review.sql');
if(!origin || !key){console.error('Provider verification NOT performed: public build credentials unavailable.');process.exitCode=1;}
else {try{const response=await fetch(new URL('/auth/v1/settings',origin),{headers:{apikey:key}});if(!response.ok)throw Error();const settings=await response.json();console.log('Provider signup disabled:',settings.disable_signup===true);console.log('Email provider retained:',settings.external?.email===true);if(settings.disable_signup!==true||settings.external?.email!==true)process.exitCode=1;}catch{console.error('Provider verification unavailable; no raw response logged.');process.exitCode=1;}}
