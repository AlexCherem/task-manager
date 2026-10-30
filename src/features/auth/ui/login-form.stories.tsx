import type { Meta, StoryContext, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, waitFor } from 'storybook/test';

import type { LoginResult, LoginValues } from '../model/login';
import { LoginForm, type LoginFormProps } from './login-form';

const credentials: LoginValues = {
  email: 'admin@example.com',
  password: 'Admin123!',
};
const submit = fn<LoginFormProps['onSubmit']>();

const meta = {
  title: 'Features/Auth/LoginForm',
  component: LoginForm,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(360px, 85vw)' }}>
        <Story />
      </div>
    ),
  ],
  args: { onSubmit: submit },
  beforeEach() {
    submit.mockReset().mockResolvedValue({ error: null });
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

async function submitForm(
  { canvas, userEvent }: Pick<StoryContext, 'canvas' | 'userEvent'>,
  values = credentials,
) {
  await userEvent.clear(canvas.getByLabelText('Email'));
  await userEvent.type(canvas.getByLabelText('Email'), values.email);
  await userEvent.clear(canvas.getByLabelText('Пароль'));
  await userEvent.type(canvas.getByLabelText('Пароль'), values.password);
  const button = canvas.getByRole('button', { name: 'Войти' });
  await userEvent.click(button);

  return button;
}

export const Submit: Story = {
  play: async (context) => {
    await submitForm(context);
    await waitFor(() =>
      expect(context.args.onSubmit).toHaveBeenCalledWith(credentials),
    );
  },
};

export const RequiredFields: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Войти' }));
    await waitFor(() => {
      expect(canvas.getByText('Введите email.')).toBeVisible();
      expect(canvas.getByText('Введите пароль.')).toBeVisible();
    });
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const InvalidEmail: Story = {
  play: async (context) => {
    await submitForm(context, { ...credentials, email: 'invalid-email' });
    await waitFor(() =>
      expect(
        context.canvas.getByText('Введите корректный email.'),
      ).toBeVisible(),
    );
    await expect(context.args.onSubmit).not.toHaveBeenCalled();
  },
};

export const RejectedCredentials: Story = {
  play: async (context) => {
    const error = 'Неверный email или пароль.';
    context.args.onSubmit.mockResolvedValue({ error });
    const button = await submitForm(context, {
      ...credentials,
      password: 'WrongPassword',
    });
    await expect(await context.canvas.findByRole('alert')).toHaveTextContent(
      error,
    );
    await waitFor(() => expect(button).toBeEnabled());
  },
};

export const ConnectionError: Story = {
  play: async (context) => {
    context.args.onSubmit.mockRejectedValue(new Error('Network unavailable'));
    await submitForm(context);
    await expect(await context.canvas.findByRole('alert')).toHaveTextContent(
      'Не удалось войти. Попробуйте ещё раз.',
    );
  },
};

export const RetryAfterError: Story = {
  play: async (context) => {
    const { args, canvas } = context;
    args.onSubmit.mockResolvedValueOnce({
      error: 'Неверный email или пароль.',
    });
    const button = await submitForm(context, {
      ...credentials,
      password: 'WrongPassword',
    });
    await expect(await canvas.findByRole('alert')).toBeVisible();
    await waitFor(() => expect(button).toBeEnabled());
    await submitForm(context);
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(canvas.queryByRole('alert')).not.toBeInTheDocument(),
    );
  },
};

export const Submitting: Story = {
  play: async (context) => {
    const { args, canvas } = context;
    const request = Promise.withResolvers<LoginResult>();
    args.onSubmit.mockReturnValueOnce(request.promise);
    const button = await submitForm(context);
    try {
      await waitFor(() => expect(args.onSubmit).toHaveBeenCalled());
      await expect(canvas.getByLabelText('Email')).toBeDisabled();
      await expect(canvas.getByLabelText('Пароль')).toBeDisabled();
      await expect(button).toBeDisabled();
    } finally {
      request.resolve({ error: null });
    }
    await waitFor(() => expect(button).toBeEnabled());
  },
};
