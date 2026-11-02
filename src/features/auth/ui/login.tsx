'use client';

import { useRouter } from 'next/navigation';

import { login } from '../api';
import { LoginForm } from './login-form';

export function Login() {
  const router = useRouter();

  return (
    <LoginForm onSubmit={login} onSuccess={() => router.replace('/lists')} />
  );
}
