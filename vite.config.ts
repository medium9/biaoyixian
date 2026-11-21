import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import {createPresenceMiddleware} from './server/presence.mjs';
export default defineConfig({
 plugins:[vue(),{name:'online-walkers',configureServer(server){server.middlewares.use(createPresenceMiddleware());}}],
 test:{include:['tests/unit/**/*.test.ts','tests/integration/**/*.test.ts']},
});
