import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    watch: {
      ignored: ['**/*.mp4', '**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.docx', '**/*.log', '**/.git/**']
    }
  }
});
