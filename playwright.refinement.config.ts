import { defineConfig } from "@playwright/test";
export default defineConfig({
 testDir:"./tests/refinement",fullyParallel:true,workers:2,timeout:60000,
 use:{baseURL:"http://127.0.0.1:4175",headless:true},
 projects:[{name:"chromium"}],
 webServer:{command:"python3 -m http.server 4175 --bind 127.0.0.1 --directory out",url:"http://127.0.0.1:4175",reuseExistingServer:false},
});
