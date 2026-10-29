import type { Preview } from '@storybook/nextjs-vite';

import { Providers } from '../src/app/providers';

import 'antd/dist/reset.css';
import '../src/app/globals.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <Providers>
        <Story />
      </Providers>
    ),
  ],
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
  },
};

export default preview;
