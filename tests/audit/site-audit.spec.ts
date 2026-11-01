import { test, expect, type Page } from "@playwright/test";
const backend="https://gsc-auth-test.supabase.co";
const id="22222222-2222-2222-2222-222222222222";
const user={id,aud:"authenticated",role:"authenticated",email:"member@example.invalid",email_confirmed_at:"2026-10-29T00:00:00Z",created_at:"2026-10-29T00:00:00Z",app_metadata:{provider:"email"},user_metadata:{full_name:"Test Member"}};
const profile={id,display_name:"Test Member with a long name",avatar_path:null,avatar_url:null,telegram_username:null,english_level:"advanced",onboarding_completed:true,created_at:"2026-01-01T00:00:00Z"};
async function setup(page:Page,role:"guest"|"member"|"admin",legacy=false,slow=false){
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(({user,role})=>{
  if(role!=="guest"){
   const token=btoa(JSON.stringify({alg:"HS256",typ:"JWT"}))+"."+btoa(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:"authenticated"}))+".test";
   localStorage.setItem("sb-gsc-auth-test-auth-token",JSON.stringify({access_token:token,refresh_token:"test-only",token_type:"bearer",expires_at:Math.floor(Date.now()/1000)+3600,user}));
  }
 },{user,role});
 await page.route("**/*",async route=>{
  const url=new URL(route.request().url());
  if(url.origin==="http://127.0.0.1:4173")return route.continue();
  if(url.origin!==backend)return route.abort();
  if(route.request().method()==="OPTIONS")return route.fulfill({headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"}});
  if(url.pathname==="/auth/v1/user")return route.fulfill({json:user});
  if(url.pathname.includes("/profiles")){
   if(slow)await new Promise(r=>setTimeout(r,1500));
   if(legacy&&url.searchParams.get("select")?.includes("first_name"))return route.fulfill({status:400,json:{code:"42703",message:"column profiles.first_name does not exist"}});
   return route.fulfill({json:route.request().headers().accept?.includes("object")?profile:[profile]});
  }
  if(url.pathname.includes("/storage/v1/object/sign/"))return route.fulfill({json:{signedURL:"/object/sign/profile-avatars/test/avatar.webp?token=test-only"}});
  if(url.pathname.includes("/storage/v1/object/"))return route.fulfill({json:{Key:`profile-avatars/${id}/avatar.webp`}});
  if(url.pathname.includes("admin_member_directory"))return route.fulfill({json:[{user_id:id,email:user.email,email_verified:true,joined_at:user.created_at,last_sign_in_at:null}]});
  if(url.pathname.includes("/user_roles"))return route.fulfill({json:route.request().headers().accept?.includes("object")?{role}:[{user_id:id,role,updated_at:user.created_at}]});
  if(url.pathname.includes("/attendance"))return route.fulfill({json:[{id:"visit",user_id:id,status:"attended",payment_status:"paid",is_paid:true,recorded_at:user.created_at}]});
  return route.fulfill({json:[]});
 });
 return errors;
}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
test("guest navigation and static pages remain usable",async({page})=>{
 const errors=await setup(page,"guest");
 await page.goto("/membership/");await expect(page.getByRole("link",{name:"Create your profile"})).toBeVisible();await noOverflow(page);expect(errors).toEqual([]);
});
test("member CTAs resolve without waiting for slow profile data on every public route",async({page})=>{
 const errors=await setup(page,"member",false,true);
 for(const path of ["/","/about/","/membership/","/community/"]){
  await page.goto(path);await expect(page.getByRole("link",{name:/View my dashboard|View my profile/}).first()).toBeVisible();
  await expect(page.getByRole("link",{name:/Create your profile|Join the club/})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Join / Login"})).toHaveCount(0);await noOverflow(page);
 }
 await page.goto("/login/");await expect(page.getByRole("heading",{name:"You’re already signed in"})).toBeVisible();expect(errors).toEqual([]);
});
test("member loyalty translations, themes and photo preparation",async({page})=>{
 const errors=await setup(page,"member",true);await page.goto("/account/");await expect(page.getByRole("heading",{name:"Your Loyalty Card"})).toBeVisible();
 await page.getByLabel("Dashboard language").selectOption("ru");await expect(page.getByRole("heading",{name:"Карта лояльности"})).toBeVisible();await expect(page.getByText("Награды участника GSC")).toBeVisible();
 for(const theme of ["light","dark"]){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.dispatchEvent(new Event("gsc-theme-change"));},theme);await noOverflow(page);
  const colors=await page.locator(".dashboard-card").first().evaluate(el=>({background:getComputedStyle(el).backgroundColor,text:getComputedStyle(el).color}));expect(colors.background).not.toBe(colors.text);
  await page.screenshot({path:`test-results/member-${test.info().project.name}-${theme}.png`,fullPage:true});
 }
 let uploads=0;
 await page.route(`${backend}/storage/v1/object/profile-avatars/**`, async route=>{
  uploads++;expect(route.request().postDataBuffer()?.includes(Buffer.from([255,216,255]))).toBe(true);
  await route.fulfill({json:{Key:`profile-avatars/${id}/avatar.webp`}});
 });
 const jpeg=Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC/AB//2Q==","base64");
 await page.getByLabel("Choose a profile photo").setInputFiles({name:"iphone.jpg",mimeType:"",buffer:jpeg});await expect(page.getByRole("dialog",{name:"Frame your photo"})).toBeVisible();await page.getByRole("button",{name:"Save photo",exact:true}).click();await expect(page.getByText("Your profile photo has been updated.")).toBeVisible();expect(uploads).toBe(1);expect(errors).toEqual([]);
});
test("admin legacy profiles load without hiding records; every tab fits both themes",async({page})=>{
 const errors=await setup(page,"admin",true);await page.goto("/admin/");await expect(page.locator(".admin-shell")).toBeVisible();
 for(const theme of ["light","dark"]){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.dispatchEvent(new Event("gsc-theme-change"));},theme);
  await noOverflow(page);await page.screenshot({path:`test-results/admin-${test.info().project.name}-${theme}.png`,fullPage:true});
 }
 for(const name of ["Members","Meetups","Attendance","Questions","Rewards","Content Editor","Media","Site Settings","Audit History"]){
  await page.locator(".admin-sidebar").getByRole("button",{name,exact:true}).click();await noOverflow(page);
 }
 await page.locator(".admin-sidebar").getByRole("button",{name:"Members",exact:true}).click();await expect(page.locator(".member-primary").getByText(profile.display_name).first()).toBeVisible();expect(errors).toEqual([]);
});
