'use client';

import { DatePicker, Form, Input, Select } from 'antd';
import type { Dayjs } from 'dayjs';

import type { CreateTaskInput } from '../api/types';
import {
  taskTitleMaxLength,
  taskStatusLabels,
  taskPriorityLabels,
} from '../model/task-config';
import styles from './task-form-fields.module.css';

export type TaskFormValues = Omit<CreateTaskInput, 'listId' | 'deadline'> & {
  deadline: Dayjs;
};

export function TaskFormFields() {
  return (
    <>
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
            virtual={false}
            options={Object.entries(taskStatusLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="priority"
          label="Приоритет"
          rules={[{ required: true, message: 'Выберите приоритет.' }]}
        >
          <Select
            virtual={false}
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
    </>
  );
}
