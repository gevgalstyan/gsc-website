import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
 testDir:"./tests/audit", workers:1, timeout:30000,
 use:{baseURL:"http://127.0.0.1:4173",headless:true},
 projects:[{name:"narrow",use:{viewport:{width:320,height:740}}},{name:"desktop",use:{viewport:{width:1440,height:1000}}},{name:"iphone",use:{...devices["iPhone 12 Mini"],defaultBrowserType:"chromium",viewport:{width:375,height:812}}}],
 webServer:{command:"python3 -m http.server 4173 --bind 127.0.0.1 --directory out",url:"http://127.0.0.1:4173",reuseExistingServer:false}
});
