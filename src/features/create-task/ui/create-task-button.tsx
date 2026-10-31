'use client';

import { Alert, Button, Form, Modal } from 'antd';
import { useState, useTransition } from 'react';

import { type CreateTaskInput, type TaskMutationResult } from '@/entities/task';

import { TaskFormFields, type TaskFormValues } from '@/entities/task/ui';

import styles from './create-task-button.module.css';

export type CreateTaskButtonProps = {
  listId: string;
  onSubmit: (values: CreateTaskInput) => Promise<TaskMutationResult>;
};

export function CreateTaskButton({ listId, onSubmit }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setError(null);
    setOpen(false);
  }

  function handleSubmit(values: TaskFormValues) {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await onSubmit({
          ...values,
          listId,
          deadline: values.deadline.toISOString(),
        });
        if (result.error !== null) {
          setError(result.error);

          return;
        }
        setOpen(false);
      } catch {
        setError('Не удалось создать задачу. Попробуйте ещё раз.');
      }
    });
  }

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Создать задачу
      </Button>
      <Modal
        title="Новая задача"
        open={open}
        onCancel={close}
        closable={!isPending}
        mask={{ closable: !isPending }}
        keyboard={!isPending}
        footer={null}
        destroyOnHidden
      >
        <Form<TaskFormValues>
          name={`create-task-${listId}`}
          layout="vertical"
          requiredMark={false}
          initialValues={{ description: '', status: 'new', priority: 'medium' }}
          disabled={isPending}
          preserve={false}
          onFinish={handleSubmit}
          onValuesChange={() => setError(null)}
          noValidate
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
          <TaskFormFields />
          <div className={styles.actions}>
            <Button onClick={close} disabled={isPending}>
              Отмена
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              disabled={isPending}
              aria-label="Создать"
            >
              Создать
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
