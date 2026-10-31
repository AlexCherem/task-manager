'use client';

import { Alert, Button, Modal } from 'antd';
import { useState, useTransition } from 'react';

import type { DeleteTaskListResult, TaskList } from '@/entities/task-list';

import styles from './delete-list-button.module.css';

export type DeleteListButtonProps = {
  list: TaskList;
  onDelete: (values: { id: string }) => Promise<DeleteTaskListResult>;
};

export function DeleteListButton({ list, onDelete }: DeleteListButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setError(null);
    setOpen(false);
  }

  function handleDelete() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await onDelete({ id: list.id });
        if (result.error !== null) {
          setError(result.error);

          return;
        }
        setOpen(false);
      } catch {
        setError('Не удалось удалить список. Попробуйте ещё раз.');
      }
    });
  }

  return (
    <>
      <Button
        size="small"
        danger
        aria-label={`Удалить список «${list.title}»`}
        onClick={() => setOpen(true)}
      >
        Удалить
      </Button>
      <Modal
        title="Удалить список?"
        open={open}
        onCancel={close}
        onOk={handleDelete}
        okText="Удалить список"
        cancelText="Отмена"
        okButtonProps={{ danger: true, disabled: isPending }}
        cancelButtonProps={{ disabled: isPending, autoFocus: true }}
        confirmLoading={isPending}
        closable={!isPending}
        mask={{ closable: !isPending }}
        keyboard={!isPending}
        destroyOnHidden
      >
        {error && (
          <Alert
            role="alert"
            type="error"
            showIcon
            title={error}
            className={styles.error}
          />
        )}
        <p className={styles.description}>
          Список «<strong>{list.title}</strong>» и все его задачи будут удалены.
        </p>
        <p>Восстановить данные будет нельзя.</p>
      </Modal>
    </>
  );
}
