import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const backend="https://gsc-auth-test.supabase.co";
const user={id:"22222222-2222-2222-2222-222222222222",aud:"authenticated",role:"authenticated",email:"test@example.invalid",email_confirmed_at:"2026-10-29T00:00:00Z",created_at:"2026-10-29T00:00:00Z",app_metadata:{provider:"email"},user_metadata:{name:"Anton"}};
async function mock(page:Page,role:"guest"|"member"|"admin"="guest",theme="dark",slow=false){
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 await page.addInitScript(({user,role,theme})=>{
  if(!localStorage.getItem("gsc-theme"))localStorage.setItem("gsc-theme",theme);
  if(role!=="guest"){
   const token=btoa(JSON.stringify({alg:"HS256",typ:"JWT"}))+"."+btoa(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:"authenticated"}))+".test";
   localStorage.setItem("sb-gsc-auth-test-auth-token",JSON.stringify({access_token:token,refresh_token:"test-only",token_type:"bearer",expires_at:Math.floor(Date.now()/1000)+3600,user}));
  }
 },{user,role,theme});
 await page.route("**/*",async route=>{
  const url=new URL(route.request().url());if(url.origin==="http://127.0.0.1:4175")return route.continue();
  if(url.hostname==="challenges.cloudflare.com")return route.fulfill({contentType:"application/javascript",body:"window.turnstile={render:(el,o)=>{const b=document.createElement('button');b.textContent='Complete test CAPTCHA';b.type='button';b.onclick=()=>o.callback('fake-token');el.append(b);return 'widget'},remove:()=>{}}"});
  if(url.origin!==backend)return route.abort();
  if(route.request().method()==="OPTIONS")return route.fulfill({headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"}});
  if(url.pathname==="/auth/v1/user")return route.fulfill({json:user});
  const object=route.request().headers().accept?.includes("object");
  if(url.pathname.includes("/profiles")){
   if(slow)await new Promise(r=>setTimeout(r,2000));
   const p={id:user.id,display_name:"Anton",avatar_path:null,avatar_url:null,onboarding_completed:true,created_at:user.created_at,first_name:"Anton",surname:"Test",age:25,nationality:"Armenia",gender:"Prefer not to say",email:user.email};
   return route.fulfill({json:object?p:[p]});
  }
  if(url.pathname.includes("/user_roles"))return route.fulfill({json:object?{role}:[{user_id:user.id,role}]});
  if(url.pathname.includes("admin_member_directory"))return route.fulfill({json:[{user_id:user.id,email:user.email,email_verified:true,joined_at:user.created_at}]});
  return route.fulfill({json:[]});
 });return errors;
}
const routes=["/","/about/","/meetups/","/questions/","/how-it-works/","/community/","/faq/","/contact/","/membership/","/privacy/","/terms/","/cookies/","/login/","/signup/","/forgot-password/"];
for(const theme of ["light","dark"])for(const path of routes)test(`${theme} ${path} accessibility and surface contract`,async({page})=>{
 const errors=await mock(page,"guest",theme);await page.goto(path);await expect(page.locator("h1")).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.theme)).toBe(theme);
 const violations=(await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations;
 expect(violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
 const surfaces=await page.locator(".membership-status-card,.question-library-stats,.question-library-panel,.contact-page-grid,.legal-main,.legal-document").evaluateAll(elements=>elements.map(el=>({selector:el.className,bg:getComputedStyle(el).backgroundColor})));
 for(const s of surfaces){const rgb=s.bg.match(/\d+/g)?.slice(0,3).map(Number)??[];if(rgb.length===3)expect(theme==="dark"?Math.max(...rgb)<100:Math.min(...rgb)>180,JSON.stringify(s)).toBe(true);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
for(const role of ["guest","member","admin"] as const)test(`${role} Contact and journey use live auth across navigation`,async({page})=>{
 const errors=await mock(page,role,"light",true);await page.goto("/contact/");
 if(role==="guest")await expect(page.getByRole("link",{name:"Create your profile",exact:true})).toBeVisible();
 else {await expect(page.getByRole("link",{name:"Open your profile",exact:true})).toBeVisible();await expect(page.getByText("Ready to join?",{exact:true})).toHaveCount(0);await expect(page.getByRole("link",{name:"Create your profile",exact:true})).toHaveCount(0);}
 await page.getByRole("link",{name:"How it works",exact:true}).first().click();
 await expect(page.getByRole("heading",{name:role==="guest"?"Register when ready":"Use your dashboard",exact:true})).toBeVisible();
 if(role!=="guest")await expect(page.getByRole("heading",{name:"Register when ready",exact:true})).toHaveCount(0);
 expect(errors).toEqual([]);
});
test("FAQ categories, bilingual search, keyboard controls and stable anchors",async({page})=>{
 const errors=await mock(page);await page.goto("/faq/");await expect(page.locator("[data-faq-id]")).toHaveCount(53);
 for(const category of ["About the club","English level","Meetups","Member account","Booking and payments","Loyalty","Website features","Privacy and security"]){
  const button=page.getByRole("group",{name:"FAQ categories"}).getByRole("button",{name:category,exact:true});await button.click();await expect(button).toHaveAttribute("aria-pressed","true");expect(await page.locator("[data-faq-id]").count()).toBeGreaterThan(0);
 }
 await page.getByRole("button",{name:"All",exact:true}).click();await page.getByRole("searchbox").fill("expiry");await expect(page.locator("[data-faq-id]")).toHaveCount(1);await page.locator("button[data-faq-question]").click();await expect(page.getByText(/Rewards can carry an expiry date/)).toBeVisible();
 const anchor=await page.locator("button[data-faq-question]").getAttribute("aria-controls");await page.getByRole("button",{name:"Switch help and policies to Russian"}).click();await expect(page.getByRole("heading",{name:"Хорошие вопросы заслуживают понятных ответов"})).toBeVisible();expect(await page.locator("button[data-faq-question]").getAttribute("aria-controls")).toBe(anchor);
 await page.getByRole("searchbox").fill("пароль");expect(await page.locator("[data-faq-id]").count()).toBeGreaterThan(0);await page.getByRole("searchbox").fill("no-match-xyz");await page.getByRole("button",{name:"Сбросить фильтры"}).click();await expect(page.locator("[data-faq-id]")).toHaveCount(53);
 const buttons=page.locator("button[data-faq-question]");await buttons.first().focus();await page.keyboard.press("ArrowDown");await expect(buttons.nth(1)).toBeFocused();await page.keyboard.press("End");await expect(buttons.last()).toBeFocused();await page.keyboard.press("Home");await expect(buttons.first()).toBeFocused();await page.keyboard.press("Enter");await expect(buttons.first()).toHaveAttribute("aria-expanded","true");
 await page.reload();await expect(page.getByRole("heading",{name:"Хорошие вопросы заслуживают понятных ответов"})).toBeVisible();expect(errors).toEqual([]);
});
test("responsive help, policies and target cards at every requested width",async({page})=>{
 await mock(page,"member");for(const width of [320,375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});for(const path of ["/faq/","/privacy/","/terms/","/cookies/","/membership/","/how-it-works/","/contact/"]){
   await page.goto(path);await expect(page.locator("h1")).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path} at ${width}`).toBe(true);
  }
 }
});
test("legal revisions are bilingual drafts with preserved dates and archived acceptance text",async({page})=>{
 await mock(page);for(const path of ["/privacy/","/terms/","/cookies/"]){
  await page.goto(path);await expect(page.getByText("Review draft — not yet effective",{exact:true})).toBeVisible();
  await expect(page.locator("#current-policy article")).toBeVisible();const count=await page.locator(".legal-document>section").count();
  await page.getByRole("button",{name:"Switch help and policies to Russian"}).click();await expect(page.getByText("Проект для проверки — ещё не вступил в силу",{exact:true})).toBeVisible();expect(await page.locator(".legal-document>section").count()).toBe(count);
  expect(await page.locator(".legal-document").innerText()).not.toMatch(/\b(Who runs|Registration information|Browser storage)\b/);
  await page.getByRole("button",{name:"Переключить справку и документы на английский"}).click();
 }
});
for(const theme of ["light","dark"])for(const [role,path] of [["member","/account/"],["admin","/admin/"]] as const)test(`${theme} ${role} workspace accessibility`,async({page})=>{
 await mock(page,role,theme);await page.goto(path);await expect(page.getByRole("heading",{name:role==="admin"?"Club overview":"Anton",exact:true})).toBeVisible();
 const violations=(await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations;
 expect(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
});
test("theme preference survives navigation and refresh without changing member identity",async({page})=>{
 const errors=await mock(page,"member","light");await page.goto("/contact/");await expect(page.getByRole("link",{name:"Open your profile",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Switch to dark mode",exact:true}).click();await page.goto("/membership/");await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.theme)).toBe("dark");await expect(page.getByRole("link",{name:"View my profile",exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole("button",{name:"Switch to light mode",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Join / Login"})).toHaveCount(0);expect(errors).toEqual([]);
});
test("semantic text and essential boundary tokens meet numeric contrast targets",async({page})=>{
 await mock(page);await page.goto("/faq/");
 const results=await page.evaluate(()=>{
  function color(token:string){const probe=document.createElement('span');probe.style.color=`var(${token})`;document.body.append(probe);const rgb=getComputedStyle(probe).color.match(/[\d.]+/g)!.slice(0,3).map(Number);probe.remove();return rgb;}
  function lum(rgb:number[]){const x=rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*x[0]+.7152*x[1]+.0722*x[2];}
  function ratio(a:number[],b:number[]){const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  const results:{theme:string;pair:string;ratio:number;minimum:number}[]=[];
  for(const theme of ['light','dark']){document.documentElement.dataset.theme=theme;
   for(const surface of ['--page-bg','--surface-1','--surface-2'])for(const foreground of ['--foreground','--foreground-secondary','--foreground-muted','--accent-text'])results.push({theme,pair:`${foreground} on ${surface}`,ratio:ratio(color(foreground),color(surface)),minimum:4.5});
   for(const surface of ['--input-bg','--surface-1'])results.push({theme,pair:`boundary on ${surface}`,ratio:ratio(color('--control-border-strong'),color(surface)),minimum:3});
  }return results;
 });
 for(const result of results)expect(result.ratio,`${result.theme}: ${result.pair}`).toBeGreaterThanOrEqual(result.minimum);
});
for(const theme of ["light","dark"])for(const role of ["guest","member"] as const)test(`${theme} ${role} dialogs and menus follow the active theme`,async({page})=>{
 await mock(page,role,theme);await page.goto(role==="guest"?"/?auth=login":"/contact/");
 async function surface(selector:string){const rgb=await page.locator(selector).evaluate(el=>getComputedStyle(el).backgroundColor.match(/\d+/g)!.slice(0,3).map(Number));expect(theme==="dark"?Math.max(...rgb)<100:Math.min(...rgb)>180).toBe(true);}
 if(role==="guest"){
  await expect(page.getByRole("dialog")).toBeVisible();await surface('[role="dialog"]>div');
  const issues=(await new AxeBuilder({page}).include('[role="dialog"]').withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations;expect(issues.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.failureSummary)}))).toEqual([]);
  await page.getByRole("button",{name:"Close",exact:true}).click();await page.setViewportSize({width:375,height:812});await page.getByRole("button",{name:"Open menu",exact:true}).click();await surface('.mobile-drawer');await expect(page.getByRole("dialog",{name:"Navigation menu"})).toBeVisible();
 }else{
  await page.locator('.profile-trigger').click();await expect(page.getByRole('menu')).toBeVisible();await surface('.profile-menu');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Notifications',exact:true}).click();await expect(page.getByRole('dialog',{name:'Notifications',exact:true})).toBeVisible();await surface('.notification-popover');
 }
});
for(const theme of ["light","dark"])test(`${theme} delayed notifications load and read state survives public navigation`,async({page})=>{
 await mock(page,"member",theme);let writes=0;
 const notices=[{id:"notice-unread",kind:"new_meetup",title:"New meetup published",body:"See the new meeting details.",read_at:null,created_at:"2026-10-31T10:00:00Z",meetup_id:null,booking_id:null,target_url:null},{id:"notice-read",kind:"new_meetup",title:"Earlier update",body:"An update you already read.",read_at:"2026-10-31T11:00:00Z",created_at:"2026-10-31T09:00:00Z",meetup_id:null,booking_id:null,target_url:null}];
 await page.route(`${backend}/rest/v1/notifications**`,async route=>{
  if(route.request().method()==="PATCH"){writes++;await route.fulfill({json:[]});return;}
  await new Promise(resolve=>setTimeout(resolve,400));await route.fulfill({json:notices});
 });
 await page.goto("/contact/");const bell=page.getByRole('button',{name:'1 unread notifications',exact:true});await expect(bell).toBeVisible();await bell.click();await expect(page.getByText('New meetup published',{exact:true})).toBeVisible();await expect(page.getByText('Earlier update',{exact:true})).toBeVisible();
 const violations=(await new AxeBuilder({page}).include('.notification-popover').withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations;expect(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.failureSummary)}))).toEqual([]);
 await page.getByRole('button',{name:'Mark all read',exact:true}).click();expect(writes).toBe(1);await expect(page.getByRole('button',{name:'Notifications',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'FAQ',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Good questions deserve clear answers',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Notifications',exact:true})).toBeVisible();expect(writes).toBe(1);
});
