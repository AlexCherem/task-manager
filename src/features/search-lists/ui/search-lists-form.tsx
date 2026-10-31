'use client';

import { Button, Input } from 'antd';
import Form from 'next/form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './search-lists-form.module.css';

function SearchButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="primary"
      htmlType="submit"
      loading={pending}
      disabled={pending}
    >
      Найти
    </Button>
  );
}

export function SearchListsForm({ query }: { query: string }) {
  const [value, setValue] = useState(query);
  const router = useRouter();

  function reset() {
    setValue('');
    router.push('/lists', { scroll: false });
  }

  return (
    <Form
      action="/lists"
      scroll={false}
      role="search"
      aria-label="Поиск списков"
      className={styles.form}
    >
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Поиск списков по названию"
        placeholder="Поиск списков по названию"
        allowClear
        className={styles.input}
      />
      <SearchButton />
      <Button htmlType="button" disabled={value.length === 0} onClick={reset}>
        Сбросить
      </Button>
    </Form>
  );
}
