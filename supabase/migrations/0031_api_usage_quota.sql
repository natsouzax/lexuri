-- Teto diário de chamadas pagas (OpenAI) por usuário.
--
-- Por que no banco e não em memória: cada request da Vercel pode cair numa
-- instância diferente, então um contador em memória não vê o que as outras
-- instâncias já gastaram. Uma linha por (usuário, balde, dia) é barata perto
-- do custo de uma transcrição.
--
-- Só o service role escreve aqui (as rotas de API). RLS ligada sem policy
-- nenhuma = ninguém no cliente lê nem escreve.
CREATE TABLE IF NOT EXISTS api_usage_quota (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket     text        NOT NULL,
  day        date        NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count      integer     NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bucket, day)
);

CREATE INDEX IF NOT EXISTS api_usage_quota_day_idx ON api_usage_quota(day DESC);

ALTER TABLE api_usage_quota ENABLE ROW LEVEL SECURITY;

-- Incrementa e devolve o total do dia numa única ida ao banco. SECURITY DEFINER
-- porque a tabela é fechada por RLS; o service role chama isso via RPC.
CREATE OR REPLACE FUNCTION bump_api_usage(p_user_id uuid, p_bucket text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO api_usage_quota (user_id, bucket, day, count, updated_at)
  VALUES (p_user_id, p_bucket, (now() AT TIME ZONE 'utc')::date, 1, now())
  ON CONFLICT (user_id, bucket, day)
  DO UPDATE SET count = api_usage_quota.count + 1, updated_at = now()
  RETURNING count INTO new_count;

  RETURN new_count;
END $$;

REVOKE ALL ON FUNCTION bump_api_usage(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION bump_api_usage(uuid, text) TO service_role;
