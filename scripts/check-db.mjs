import { getDb } from '../src/server/db.ts';

try {
  const sql = getDb();
  const [result] = await sql.query('SELECT 1 AS ok', [], {
    fetchOptions: { signal: AbortSignal.timeout(15_000) },
  });
  if (result?.ok !== 1) {
    throw new Error('Unexpected database response.');
  }

  console.log('Подключение к PostgreSQL успешно: SELECT 1 вернул 1.');
} catch {
  console.error(
    'Не удалось подключиться к PostgreSQL. Проверьте DATABASE_URL и доступность Neon.',
  );
  process.exitCode = 1;
}
