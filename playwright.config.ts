import {defineConfig} from '@playwright/test';
const production=process.env.E2E_PRODUCTION==='1';
const port=production?4178:5173;
const baseURL=`http://127.0.0.1:${port}`;
export default defineConfig({
 testDir:'tests/e2e',workers:1,
 // Every browser shares one room; keep unrelated tests out of each other's maps.
 use:{baseURL,channel:'msedge'},
 webServer:{command:production?'pnpm start':'pnpm dev',url:baseURL,reuseExistingServer:false,
  env:{HOST:'127.0.0.1',PORT:String(port)}},
 reporter:'list',
});
