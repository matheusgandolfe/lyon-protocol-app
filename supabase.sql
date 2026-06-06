-- ═══════════════════════════════════════════
-- LYON PROTOCOL — SQL do Supabase
-- Cole isso no SQL Editor do Supabase e execute
-- ═══════════════════════════════════════════

-- 1. Tabela de perfis
CREATE TABLE IF NOT EXISTS perfis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nome TEXT,
  peso NUMERIC,
  altura NUMERIC,
  idade INTEGER,
  genero TEXT DEFAULT 'masculino',
  objetivo TEXT DEFAULT 'perder',
  atividade TEXT DEFAULT 'moderado',
  treino_tipo TEXT DEFAULT 'musculacao',
  treino_freq TEXT DEFAULT '4',
  restricoes TEXT,
  refeicoes_dia TEXT DEFAULT '3',
  tempo_cozinhar TEXT DEFAULT 'pouco',
  peso_meta NUMERIC,
  macros JSONB,
  onboarding_completo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de refeições do dia
CREATE TABLE IF NOT EXISTS refeicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  nome TEXT NOT NULL,
  proteina NUMERIC DEFAULT 0,
  carb NUMERIC DEFAULT 0,
  gordura NUMERIC DEFAULT 0,
  kcal NUMERIC DEFAULT 0,
  texto_original TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Biblioteca de refeições
CREATE TABLE IF NOT EXISTS biblioteca (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT DEFAULT 'personalizado',
  proteina NUMERIC DEFAULT 0,
  carb NUMERIC DEFAULT 0,
  gordura NUMERIC DEFAULT 0,
  kcal NUMERIC DEFAULT 0,
  padrao BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Marmitas (Fase 2)
CREATE TABLE IF NOT EXISTS marmitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  proteina NUMERIC DEFAULT 0,
  carb NUMERIC DEFAULT 0,
  gordura NUMERIC DEFAULT 0,
  kcal NUMERIC DEFAULT 0,
  componentes JSONB,
  dias INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- RLS (Row Level Security) — cada usuário vê só os seus dados
-- ═══════════════════════════════════════════

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblioteca ENABLE ROW LEVEL SECURITY;
ALTER TABLE marmitas ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "perfis_select" ON perfis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "perfis_insert" ON perfis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "perfis_update" ON perfis FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para refeicoes
CREATE POLICY "refeicoes_select" ON refeicoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "refeicoes_insert" ON refeicoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "refeicoes_delete" ON refeicoes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para biblioteca
CREATE POLICY "biblioteca_select" ON biblioteca FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "biblioteca_insert" ON biblioteca FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "biblioteca_delete" ON biblioteca FOR DELETE USING (auth.uid() = user_id);

-- Políticas para marmitas
CREATE POLICY "marmitas_select" ON marmitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "marmitas_insert" ON marmitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "marmitas_delete" ON marmitas FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "marmitas_update" ON marmitas FOR UPDATE USING (auth.uid() = user_id);
