import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from 'antd';
import { expect, fn } from 'storybook/test';

const meta = {
  title: 'UI/Ant Design',
  component: Button,
  args: {
    children: 'Создать список',
    type: 'primary',
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// A smoke test for the UI testing setup. Product stories will accompany features.
export const PrimaryButton: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Создать список' }),
    );
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
