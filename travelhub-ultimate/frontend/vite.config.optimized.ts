import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disabled for production security
    // Увеличиваем лимит (или можно убрать предупреждение)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Улучшенное разбиение на chunks для оптимальной загрузки
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }

          // React Router
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router';
          }

          // State management
          if (id.includes('node_modules/zustand/') || id.includes('node_modules/@tanstack/react-query/')) {
            return 'state';
          }

          // Animation library
          if (id.includes('node_modules/framer-motion/')) {
            return 'ui-animation';
          }

          // Icons library
          if (id.includes('node_modules/lucide-react/')) {
            return 'ui-icons';
          }

          // Form libraries
          if (
            id.includes('node_modules/react-datepicker/') ||
            id.includes('node_modules/react-select/')
          ) {
            return 'forms';
          }

          // Validation
          if (id.includes('node_modules/zod/')) {
            return 'validation';
          }

          // HTTP client
          if (id.includes('node_modules/axios/')) {
            return 'http';
          }

          // Charts
          if (id.includes('node_modules/recharts/')) {
            return 'charts';
          }

          // Utilities
          if (
            id.includes('node_modules/date-fns/') ||
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tailwind-merge/')
          ) {
            return 'utils';
          }

          // Toast notifications
          if (id.includes('node_modules/react-hot-toast/')) {
            return 'notifications';
          }

          // Other node_modules - group into vendor chunk
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },

        // Naming pattern for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Target modern browsers for smaller bundle
    target: 'es2020',

    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
