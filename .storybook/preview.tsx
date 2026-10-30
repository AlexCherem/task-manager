import type { Preview } from '@storybook/nextjs-vite';

import { AppProviders } from '../src/app/providers';

import 'antd/dist/reset.css';
import '../src/app/globals.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppProviders>
        <Story />
      </AppProviders>
    ),
  ],
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
  },
};

export default preview;
