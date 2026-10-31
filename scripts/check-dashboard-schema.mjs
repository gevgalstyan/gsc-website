/** Public, zero-row schema probes only. Does not read member records or change settings. */
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(),false);
const origin=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if(!origin||!key)throw new Error("Configure the public Supabase build variables. No credentials were printed.");
let needsAttention=false;
for(const [table,columns] of [["profiles",["id","display_name","avatar_path","onboarding_completed","first_name","surname","age","nationality","gender","email"]],["user_roles",["user_id","role"]]]){
 for(const column of columns){
  try{
   const url=new URL(`/rest/v1/${table}`,origin);url.searchParams.set("select",column);url.searchParams.set("limit","0");
   const response=await fetch(url,{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
   const body=await response.json();const code=body?.code;
   if(code==="42703"||code==="PGRST204"){console.log(`${table}.${column}: MISSING COLUMN`);needsAttention=true;}
   else if(code==="42501")console.log(`${table}.${column}: recognized; anonymous access denied (administrator access not tested)`);
   else if(response.ok)console.log(`${table}.${column}: recognized; zero rows requested (RLS/administrator access not tested)`);
   else{console.log(`${table}.${column}: could not verify (HTTP ${response.status})`);needsAttention=true;}
  }catch{console.log(`${table}.${column}: network/schema check unavailable; no credential values printed`);needsAttention=true;}
 }
}
console.log("No profiles, roles, attendance, bookings, or Storage objects were read or changed. Run the private SQL inspection for grants/policies and test with an existing administrator before declaring production fixed.");
process.exitCode=needsAttention?1:0;
