'use server';

import { redirect } from 'next/navigation';

import {
  authenticate,
  createSession,
  deleteSession,
} from '@/server/auth/session';

import type { LoginResult } from '../model/login';

export async function login(input: unknown): Promise<LoginResult> {
  if (typeof input !== 'object' || input === null) {
    return { error: 'Проверьте email и пароль.' };
  }

  const { email, password } = input as Record<string, unknown>;
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.trim().length === 0 ||
    email.length > 254 ||
    password.length === 0 ||
    password.length > 128
  ) {
    return { error: 'Проверьте email и пароль.' };
  }

  if (!authenticate(email.trim().toLowerCase(), password)) {
    return { error: 'Неверный email или пароль.' };
  }

  await createSession();
  redirect('/lists');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
