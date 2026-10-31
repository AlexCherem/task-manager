CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  deadline timestamptz NOT NULL CHECK (isfinite(deadline)),
  created_at timestamptz NOT NULL DEFAULT now()
);
