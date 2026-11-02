import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authenticate, createSession, deleteSession, redirect } = vi.hoisted(
  () => ({
    authenticate: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    redirect: vi.fn(),
  }),
);
vi.mock('@/server/auth/session', () => ({
  authenticate,
  createSession,
  deleteSession,
}));
vi.mock('next/navigation', () => ({ redirect }));

import { login, logout } from './actions';

const credentials = { email: 'admin@example.com', password: 'Admin123!' };
const redirectSignal = new Error('NEXT_REDIRECT');

beforeEach(() => {
  vi.resetAllMocks();
  authenticate.mockReturnValue(true);
  createSession.mockResolvedValue(undefined);
  deleteSession.mockResolvedValue(undefined);
  redirect.mockImplementation(() => {
    throw redirectSignal;
  });
});

describe('login action', () => {
  it('returns success after creating the session without rejecting the form with a redirect', async () => {
    await expect(
      login({ ...credentials, email: '  ADMIN@EXAMPLE.COM  ' }),
    ).resolves.toEqual({ error: null });
    expect(authenticate).toHaveBeenCalledExactlyOnceWith(
      credentials.email,
      credentials.password,
    );
    expect(createSession).toHaveBeenCalledOnce();
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    null,
    'invalid',
    [],
    {},
    { ...credentials, email: 123 },
    { ...credentials, email: '   ' },
    { ...credentials, email: 'a'.repeat(255) },
    { ...credentials, password: 123 },
    { ...credentials, password: '' },
    { ...credentials, password: 'a'.repeat(129) },
  ])('rejects invalid input without creating a session: %j', async (input) => {
    await expect(login(input)).resolves.toEqual({
      error: 'Проверьте email и пароль.',
    });
    expect(authenticate).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('returns an error for incorrect credentials without creating a session', async () => {
    authenticate.mockReturnValue(false);
    await expect(
      login({ ...credentials, password: 'WrongPassword' }),
    ).resolves.toEqual({ error: 'Неверный email или пароль.' });
    expect(createSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('does not report success when session creation fails', async () => {
    const error = new Error('Session unavailable');
    createSession.mockRejectedValue(error);
    await expect(login(credentials)).rejects.toBe(error);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('logout action', () => {
  it('deletes the session before redirecting to login', async () => {
    await expect(logout()).rejects.toBe(redirectSignal);
    expect(deleteSession).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledExactlyOnceWith('/login');
    expect(deleteSession.mock.invocationCallOrder[0]).toBeLessThan(
      redirect.mock.invocationCallOrder[0],
    );
  });
});
