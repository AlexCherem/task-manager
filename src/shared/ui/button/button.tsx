'use client';

import { Button as AntdButton } from 'antd';
import type { ComponentProps } from 'react';

export type ButtonProps = ComponentProps<typeof AntdButton>;

export function Button({
  loading,
  disabled,
  'aria-busy': ariaBusy,
  ...props
}: ButtonProps) {
  const isLoading = Boolean(loading);

  return (
    <AntdButton
      {...props}
      loading={loading}
      disabled={isLoading ? true : disabled}
      aria-busy={isLoading ? true : ariaBusy}
    />
  );
}
