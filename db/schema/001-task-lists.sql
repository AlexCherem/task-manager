CREATE TABLE IF NOT EXISTS task_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
