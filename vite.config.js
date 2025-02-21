/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:10:21
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-11 16:38:09
 * @FilePath: /zr-publish/vite.config.js
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
const resolve = (dir) => path.join(__dirname, dir);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    },
  },
  resolve: {
    // 设置别名
    alias: {
      '@': resolve('src'),
    },
  },
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3020, // 启动端口
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    cors: true,
  },
});
