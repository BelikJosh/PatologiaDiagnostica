import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ✅ Configuración para polyfills
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis', // Soluciona 'global is not defined'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(), // Polyfills para build
      ],
    },
  },
  
  resolve: {
    alias: {
      // Alias para compatibilidad con AWS SDK
      './runtimeConfig': './runtimeConfig.browser',
    },
  },
});