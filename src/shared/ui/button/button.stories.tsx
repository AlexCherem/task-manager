import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Form } from 'antd';
import { useRef } from 'react';
import { expect, fn } from 'storybook/test';

import { Button } from './button';

const click = fn();
const submit = fn();
const meta = {
  title: 'Shared/Button',
  component: Button,
  args: { children: 'Кнопка', onClick: click },
  beforeEach() {
    click.mockReset();
    submit.mockReset();
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { type: 'primary' },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Кнопка' });
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(click).toHaveBeenCalledOnce();
  },
};
export const Danger: Story = {
  args: { danger: true, size: 'small', children: 'Удалить' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Удалить' }));
    await expect(click).toHaveBeenCalledOnce();
  },
};
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Кнопка' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(click).not.toHaveBeenCalled();
  },
};
export const Loading: Story = {
  args: { loading: true, disabled: false },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: /Кнопка$/ });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    await expect(click).not.toHaveBeenCalled();
  },
};
export const DelayedLoading: Story = {
  args: { loading: { delay: 1000 } },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: /Кнопка$/ });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    await expect(click).not.toHaveBeenCalled();
  },
};
export const InheritedDisabled: Story = {
  render: (args) => (
    <Form disabled>
      <Button {...args} />
    </Form>
  ),
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Кнопка' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(click).not.toHaveBeenCalled();
  },
};
export const SubmitForm: Story = {
  render: () => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Button>Обычная кнопка</Button>
      <Button type="primary" htmlType="submit">
        Отправить
      </Button>
    </form>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Обычная кнопка' }),
    );
    await expect(submit).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Отправить' }));
    await expect(submit).toHaveBeenCalledOnce();
  },
};
function RefExample() {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button onClick={() => ref.current?.focus()}>Перевести фокус</Button>
      <Button ref={ref}>Целевая кнопка</Button>
    </>
  );
}
export const ForwardedRef: Story = {
  render: () => <RefExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Перевести фокус' }),
    );
    await expect(
      canvas.getByRole('button', { name: 'Целевая кнопка' }),
    ).toHaveFocus();
  },
};
export const Link: Story = {
  args: { href: '#button-demo', target: '_blank', children: 'Открыть ссылку' },
  play: async ({ canvas, userEvent }) => {
    click.mockImplementationOnce((event) => event.preventDefault());
    const link = canvas.getByRole('link', { name: 'Открыть ссылку' });
    await expect(link).toHaveAttribute('href', '#button-demo');
    await expect(link).toHaveAttribute('target', '_blank');
    await userEvent.click(link);
    await expect(click).toHaveBeenCalledOnce();
  },
};
