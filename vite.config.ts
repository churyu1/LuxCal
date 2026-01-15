
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages で公開する場合は '/' をリポジトリ名（例: '/your-repo-name/'）に変更してください。
  // Vercel なら '/' のままで問題ありません。
  base: './',
  build: {
    outDir: 'dist',
  }
});
