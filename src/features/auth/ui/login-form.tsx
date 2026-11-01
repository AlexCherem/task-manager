'use client';

import { Alert, Form, Input } from 'antd';
import { useState, useTransition } from 'react';

import { Button } from '@/shared/ui/button';

import type { LoginResult, LoginValues } from '../model/login';

export type LoginFormProps = {
  onSubmit: (values: LoginValues) => Promise<LoginResult>;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(values: LoginValues) {
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await onSubmit(values);
        setError(result.error);
      } catch {
        setError('Не удалось войти. Попробуйте ещё раз.');
      }
    });
  }

  return (
    <Form<LoginValues>
      name="login"
      layout="vertical"
      requiredMark={false}
      disabled={isPending}
      onFinish={handleSubmit}
      onValuesChange={() => setError(null)}
      noValidate
    >
      {error && (
        <Alert
          type="error"
          role="alert"
          showIcon
          title={error}
          style={{ marginBottom: 20 }}
        />
      )}
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, whitespace: true, message: 'Введите email.' },
          { type: 'email', message: 'Введите корректный email.' },
          { max: 254, message: 'Email не должен превышать 254 символа.' },
        ]}
      >
        <Input
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          size="large"
        />
      </Form.Item>
      <Form.Item
        name="password"
        label="Пароль"
        rules={[
          { required: true, message: 'Введите пароль.' },
          { max: 128, message: 'Пароль не должен превышать 128 символов.' },
        ]}
      >
        <Input.Password autoComplete="current-password" size="large" />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          aria-label="Войти"
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={isPending}
        >
          Войти
        </Button>
      </Form.Item>
    </Form>
  );
}
