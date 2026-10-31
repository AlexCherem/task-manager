import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input, Modal } from 'antd';
import { expect, waitFor, within } from 'storybook/test';

import { ThemeSwitcher } from './theme-switcher';

const meta = {
  title: 'Features/Theme/ThemeSwitcher',
  component: ThemeSwitcher,
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SwitchModes: Story = {
  play: async ({ canvas, userEvent }) => {
    const dark = canvas.getByRole('radio', { name: 'Тёмная' });
    const light = canvas.getByRole('radio', { name: 'Светлая' });
    const system = canvas.getByRole('radio', { name: 'Системная' });

    await waitFor(() => expect(dark).toBeEnabled());
    try {
      await userEvent.click(canvas.getByText('Тёмная', { exact: true }));
      await waitFor(() => {
        expect(dark).toBeChecked();
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
        expect(localStorage.getItem('task-manager-theme')).toBe('dark');
      });

      await userEvent.click(canvas.getByText('Светлая', { exact: true }));
      await waitFor(() => {
        expect(light).toBeChecked();
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
        expect(localStorage.getItem('task-manager-theme')).toBe('light');
      });
    } finally {
      await userEvent.click(canvas.getByText('Системная', { exact: true }));
    }

    await waitFor(() => {
      const systemTheme = matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      expect(system).toBeChecked();
      expect(document.documentElement).toHaveAttribute(
        'data-theme',
        systemTheme,
      );
      expect(localStorage.getItem('task-manager-theme')).toBe('system');
    });
  },
};

export const ModalTheme: Story = {
  render: () => (
    <Modal title="Тема модального окна" open footer={null} closable={false}>
      <ThemeSwitcher />
      <Input aria-label="Пример поля" />
    </Modal>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
      'dialog',
      { name: 'Тема модального окна' },
    );
    const content = dialog.querySelector('.ant-modal-container');
    const form = within(dialog);
    await waitFor(() =>
      expect(form.getByRole('radio', { name: 'Тёмная' })).toBeEnabled(),
    );
    try {
      await userEvent.click(form.getByText('Тёмная', { exact: true }));
      await waitFor(() => {
        expect(content).toHaveStyle({ backgroundColor: 'rgb(31, 31, 31)' });
        expect(form.getByRole('textbox', { name: 'Пример поля' })).toHaveStyle({
          backgroundColor: 'rgb(20, 20, 20)',
        });
      });
      await userEvent.click(form.getByText('Светлая', { exact: true }));
      await waitFor(() => {
        expect(content).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
        expect(form.getByRole('textbox', { name: 'Пример поля' })).toHaveStyle({
          backgroundColor: 'rgb(255, 255, 255)',
        });
      });
    } finally {
      await userEvent.click(form.getByText('Системная', { exact: true }));
    }
  },
};
