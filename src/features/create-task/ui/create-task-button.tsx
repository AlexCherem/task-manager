'use client';

import { Alert, Button, DatePicker, Form, Input, Modal, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState, useTransition } from 'react';

import {
  taskTitleMaxLength,
  taskStatusLabels,
  taskPriorityLabels,
  type CreateTaskInput,
  type TaskMutationResult,
} from '@/entities/task';

import styles from './create-task-button.module.css';

type TaskFormValues = Omit<CreateTaskInput, 'listId' | 'deadline'> & {
  deadline: Dayjs;
};

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
          <Form.Item
            name="title"
            label="Название задачи"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Введите название задачи.',
              },
              {
                max: taskTitleMaxLength,
                message: `Не более ${taskTitleMaxLength} символов.`,
              },
            ]}
          >
            <Input maxLength={taskTitleMaxLength} autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className={styles.fields}>
            <Form.Item
              name="status"
              label="Статус"
              rules={[{ required: true, message: 'Выберите статус.' }]}
            >
              <Select
                options={Object.entries(taskStatusLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
              />
            </Form.Item>
            <Form.Item
              name="priority"
              label="Приоритет"
              rules={[{ required: true, message: 'Выберите приоритет.' }]}
            >
              <Select
                options={Object.entries(taskPriorityLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
              />
            </Form.Item>
          </div>
          <Form.Item
            name="deadline"
            label="Дедлайн"
            extra="Дата и время в вашем часовом поясе. Можно указать прошедший дедлайн."
            rules={[{ required: true, message: 'Укажите дедлайн.' }]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD.MM.YYYY HH:mm"
              needConfirm={false}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
              }}
              className={styles.deadline}
              classNames={{ popup: { root: styles.calendarPopup } }}
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
