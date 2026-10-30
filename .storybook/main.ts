import type { StorybookConfig } from '@storybook/nextjs-vite';
import { mergeConfig, type UserConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-vitest'],
  framework: '@storybook/nextjs-vite',
  viteFinal(config) {
    return mergeConfig(config, {
      optimizeDeps: { include: ['@ant-design/nextjs-registry'] },
      build: {
        rolldownOptions: {
          onLog(level, log, defaultHandler) {
            // Storybook renders in the browser; Next.js handles RSC boundaries in the app.
            if (
              level === 'warn' &&
              log.code === 'MODULE_LEVEL_DIRECTIVE' &&
              log.message.includes('use client')
            ) {
              return;
            }
            defaultHandler(level, log);
          },
        },
      },
    } satisfies UserConfig);
  },
};

export default config;
