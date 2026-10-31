'use client';

import { Alert, Button, Form, Input, Modal } from 'antd';
import { useState, useTransition } from 'react';

import {
  taskListTitleMaxLength,
  type CreateTaskListResult,
} from '@/entities/task-list';

import styles from './create-list-button.module.css';

type CreateListValues = { title: string };

export type CreateListButtonProps = {
  onSubmit: (values: CreateListValues) => Promise<CreateTaskListResult>;
};

export function CreateListButton({ onSubmit }: CreateListButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form] = Form.useForm<CreateListValues>();

  function close() {
    if (isPending) return;
    form.resetFields();
    setError(null);
    setOpen(false);
  }

  function handleSubmit(values: CreateListValues) {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await onSubmit(values);
        if (result.error !== null) {
          setError(result.error);

          return;
        }
        form.resetFields();
        setOpen(false);
      } catch {
        setError('Не удалось создать список. Попробуйте ещё раз.');
      }
    });
  }

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Создать список
      </Button>
      <Modal
        title="Новый список"
        open={open}
        onCancel={close}
        closable={!isPending}
        mask={{ closable: !isPending }}
        keyboard={!isPending}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateListValues>
          form={form}
          name="create-list"
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
