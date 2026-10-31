import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, fn, waitFor } from 'storybook/test';

import { SearchListsForm } from './search-lists-form';

const submit = fn<(query: string) => void>();

const meta = {
  title: 'Features/Lists/SearchListsForm',
  component: SearchListsForm,
  args: { query: '' },
  // Keep navigation inside the story; real URL transitions are checked in the app.
  decorators: [
    (Story) => (
      <div
        onSubmitCapture={(event) => {
          event.preventDefault();
          const form = event.target;
          if (form instanceof HTMLFormElement) {
            submit(String(new FormData(form).get('q') ?? ''));
          }
        }}
      >
        <Story />
      </div>
    ),
  ],
  beforeEach() {
    getRouter().push.mockClear();
    submit.mockClear();
  },
} satisfies Meta<typeof SearchListsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Submit: Story = {
  play: async ({ canvas, userEvent }) => {
    const query = 'Работа 50% & _';
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Поиск списков по названию' }),
      query,
    );
    await expect(submit).not.toHaveBeenCalled();
    await expect(
      canvas.getByRole('search', { name: 'Поиск списков' }),
    ).toHaveAttribute('action', '/lists');
    await userEvent.click(canvas.getByRole('button', { name: 'Найти' }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    await expect(submit).toHaveBeenCalledWith(query);
  },
};

export const SubmitWithEnter: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Поиск списков по названию' }),
      'Личные{Enter}',
    );
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    await expect(submit).toHaveBeenCalledWith('Личные');
  },
};

export const PrefilledAndReset: Story = {
  args: { query: 'Работа' },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole('searchbox', { name: 'Поиск списков по названию' }),
    ).toHaveValue('Работа');
    const reset = canvas.getByRole('button', { name: 'Сбросить' });
    await expect(reset).toBeEnabled();
    await userEvent.click(reset);
    await expect(getRouter().push).toHaveBeenCalledOnce();
    await expect(getRouter().push).toHaveBeenCalledWith('/lists', {
      scroll: false,
    });
    await expect(
      canvas.getByRole('searchbox', { name: 'Поиск списков по названию' }),
    ).toHaveValue('');
    await expect(submit).not.toHaveBeenCalled();
  },
};

export const ClearAndSubmit: Story = {
  args: { query: 'Работа' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.clear(
      canvas.getByRole('searchbox', { name: 'Поиск списков по названию' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Найти' }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    await expect(submit).toHaveBeenCalledWith('');
  },
};

export const ResetButtonAvailability: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('searchbox', {
      name: 'Поиск списков по названию',
    });
    const reset = canvas.getByRole('button', { name: 'Сбросить' });
    await expect(reset).toBeVisible();
    await expect(reset).toBeDisabled();
    await userEvent.click(reset);
    await expect(getRouter().push).not.toHaveBeenCalled();
    await userEvent.type(input, 'Работа');
    await expect(reset).toBeEnabled();
    await userEvent.clear(input);
    await expect(reset).toBeDisabled();
  },
};
