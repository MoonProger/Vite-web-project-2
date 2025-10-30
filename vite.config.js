import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/Vite-web-project-2/', // имя твоего репозитория!
  // base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cats: resolve(__dirname, 'cats.html'),
        meals: resolve(__dirname, 'meals.html'),
      }
    }
  }
  
});