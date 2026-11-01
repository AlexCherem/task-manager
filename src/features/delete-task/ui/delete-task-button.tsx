'use client';

import { Alert, Modal } from 'antd';
import { useState, useTransition } from 'react';

import { Button } from '@/shared/ui/button';

import type { DeleteTaskInput, DeleteTaskResult, Task } from '@/entities/task';

import styles from './delete-task-button.module.css';

export type DeleteTaskButtonProps = {
  task: Pick<Task, 'id' | 'listId' | 'title'>;
  onDelete: (values: DeleteTaskInput) => Promise<DeleteTaskResult>;
};

export function DeleteTaskButton({ task, onDelete }: DeleteTaskButtonProps) {
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
        const result = await onDelete({ id: task.id, listId: task.listId });
        if (result.error !== null) {
          setError(result.error);

          return;
        }
        setOpen(false);
      } catch {
        setError('Не удалось удалить задачу. Попробуйте ещё раз.');
      }
    });
  }

  return (
    <>
      <Button
        size="small"
        danger
        aria-label={`Удалить задачу «${task.title}»`}
        onClick={() => setOpen(true)}
      >
        Удалить
      </Button>
      <Modal
        title="Удалить задачу?"
        open={open}
        onCancel={close}
        onOk={handleDelete}
        okText="Удалить задачу"
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
          Задача «<strong>{task.title}</strong>» будет удалена.
        </p>
        <p>Восстановить задачу будет нельзя.</p>
      </Modal>
    </>
  );
}
