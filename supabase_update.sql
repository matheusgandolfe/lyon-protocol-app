-- Adicionar coluna unidade na biblioteca
ALTER TABLE biblioteca ADD COLUMN IF NOT EXISTS unidade TEXT DEFAULT 'g';

-- Limpar biblioteca padrão antiga (vai ser repopulada no próximo login)
DELETE FROM biblioteca WHERE padrao = true;
