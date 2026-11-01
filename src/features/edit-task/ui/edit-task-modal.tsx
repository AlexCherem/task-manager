'use client';

import { Alert, Form, Modal } from 'antd';
import dayjs from 'dayjs';
import { useState, useTransition } from 'react';

import { Button } from '@/shared/ui/button';

import type {
  Task,
  TaskMutationResult,
  UpdateTaskInput,
} from '@/entities/task';
import { TaskFormFields, type TaskFormValues } from '@/entities/task/ui';

import styles from './edit-task-modal.module.css';

export type EditTaskModalProps = {
  task: Task;
  onClose: () => void;
  onSubmit: (input: UpdateTaskInput) => Promise<TaskMutationResult>;
};

export function EditTaskModal({ task, onClose, onSubmit }: EditTaskModalProps) {
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (!isPending) setOpen(false);
  }

  function handleSubmit(values: TaskFormValues) {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await onSubmit({
          ...values,
          id: task.id,
          listId: task.listId,
          deadline: values.deadline.toISOString(),
        });
        if (result.error !== null) {
          setError(result.error);

          return;
        }
        setOpen(false);
      } catch {
        setError('Не удалось сохранить задачу. Попробуйте ещё раз.');
      }
    });
  }

  return (
    <Modal
      title="Редактирование задачи"
      open={open}
      afterClose={onClose}
      onCancel={close}
      closable={!isPending}
      mask={{ closable: !isPending }}
      keyboard={!isPending}
      footer={null}
    >
      <Form<TaskFormValues>
        name={`edit-task-${task.id}`}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          deadline: dayjs(task.deadline),
        }}
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
            aria-label="Сохранить"
          >
            Сохранить
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
