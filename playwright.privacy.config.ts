import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/privacy',fullyParallel:true,workers:2,timeout:45000,use:{baseURL:'http://127.0.0.1:4176',headless:true},projects:[{name:'chromium'}],webServer:{command:'python3 -m http.server 4176 --bind 127.0.0.1 --directory out',url:'http://127.0.0.1:4176',reuseExistingServer:false}});
