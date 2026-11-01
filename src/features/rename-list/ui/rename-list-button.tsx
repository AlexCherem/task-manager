'use client';

import { Alert, Form, Input, Modal } from 'antd';
import { useState, useTransition } from 'react';

import { Button } from '@/shared/ui/button';

import {
  taskListTitleMaxLength,
  type TaskListMutationResult,
  type TaskList,
} from '@/entities/task-list';

import styles from './rename-list-button.module.css';

type RenameListValues = { title: string };

export type RenameListButtonProps = {
  list: TaskList;
  onSubmit: (
    values: RenameListValues & { id: string },
  ) => Promise<TaskListMutationResult>;
};

export function RenameListButton({ list, onSubmit }: RenameListButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return;
    setError(null);
    setOpen(false);
  }

  function handleSubmit(values: RenameListValues) {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await onSubmit({ id: list.id, ...values });
        if (result.error !== null) {
          setError(result.error);

          return;
        }
        setOpen(false);
      } catch {
        setError('Не удалось переименовать список. Попробуйте ещё раз.');
      }
    });
  }

  return (
    <>
      <Button
        size="small"
        aria-label={`Переименовать список «${list.title}»`}
        onClick={() => setOpen(true)}
      >
        Переименовать
      </Button>
      <Modal
        title="Переименовать список"
        open={open}
        onCancel={close}
        closable={!isPending}
        mask={{ closable: !isPending }}
        keyboard={!isPending}
        footer={null}
        destroyOnHidden
      >
        <Form<RenameListValues>
          name={`rename-list-${list.id}`}
          initialValues={{ title: list.title }}
          layout="vertical"
          requiredMark={false}
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
          <Form.Item
            name="title"
            label="Название списка"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Введите название списка.',
              },
              {
                max: taskListTitleMaxLength,
                message: `Не более ${taskListTitleMaxLength} символов.`,
              },
            ]}
          >
            <Input
              placeholder="Например, рабочие задачи"
              maxLength={taskListTitleMaxLength}
              autoFocus
            />
          </Form.Item>
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
    </>
  );
}
