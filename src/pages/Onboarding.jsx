import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { calcularMacros, estimarPesoMeta, BIBLIOTECA_PADRAO } from '../lib/lyon'
import { supabase } from '../lib/supabase'

const TOTAL_ETAPAS = 6

export default function Onboarding() {
  const [etapa, setEtapa] = useState(1)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const { user, salvarPerfil } = useAuth()
  const navigate = useNavigate()

  const [dados, setDados] = useState({
    nome: '', peso: '', altura: '', idade: '', genero: 'masculino',
    objetivo: 'perder', atividade: 'moderado',
    treino_tipo: 'musculacao', treino_freq: '4',
    restricoes: '', preferencias: [],
    refeicoes_dia: '3', tempo_cozinhar: 'pouco',
    pesoMeta: '',
  })

  const set = (campo, valor) => setDados(p => ({ ...p, [campo]: valor }))

  function avancar() {
    setErro('')
    if (etapa === 1 && !dados.nome) return setErro('Digite seu nome')
    if (etapa === 1 && (!dados.peso || !dados.altura || !dados.idade)) return setErro('Preencha todos os campos')
    if (etapa < TOTAL_ETAPAS) setEtapa(e => e + 1)
    else finalizar()
  }

  function voltar() {
    if (etapa > 1) setEtapa(e => e - 1)
  }

  async function finalizar() {
    setLoading(true)
    try {
      const pesoNum = parseFloat(dados.peso)
      const altNum = parseFloat(dados.altura)
      const idadeNum = parseInt(dados.idade)
      const pesoMeta = dados.pesoMeta ? parseFloat(dados.pesoMeta) : estimarPesoMeta(pesoNum, altNum, dados.objetivo)

      const perfilDados = {
        ...dados,
        peso: pesoNum,
        altura: altNum,
        idade: idadeNum,
        peso_meta: pesoMeta,
        onboarding_completo: true,
      }

      const macros = calcularMacros({
        peso: pesoNum, altura: altNum, idade: idadeNum,
        genero: dados.genero, objetivo: dados.objetivo,
        atividade: dados.atividade, pesoMeta,
      })

      await salvarPerfil({ ...perfilDados, macros: JSON.stringify(macros) })

      // Popula biblioteca com refeições padrão
      const biblio = BIBLIOTECA_PADRAO.map(r => ({
        user_id: user.id,
        nome: r.nome,
        categoria: r.categoria,
        proteina: r.proteina,
        carb: r.carb,
        gordura: r.gordura,
        kcal: r.kcal,
        padrao: true,
      }))
      await supabase.from('biblioteca').insert(biblio)

      navigate('/')
    } catch (err) {
      setErro('Erro ao salvar. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const macrosPreview = etapa >= 3 && dados.peso && dados.altura ? (() => {
    const pesoMeta = dados.pesoMeta ? parseFloat(dados.pesoMeta) : estimarPesoMeta(parseFloat(dados.peso), parseFloat(dados.altura), dados.objetivo)
    return calcularMacros({ peso: parseFloat(dados.peso), altura: parseFloat(dados.altura), idade: parseInt(dados.idade) || 30, genero: dados.genero, objetivo: dados.objetivo, atividade: dados.atividade, pesoMeta })
  })() : null

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      {/* Progress */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em' }}>
            ETAPA {etapa} DE {TOTAL_ETAPAS}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
            {Math.round((etapa / TOTAL_ETAPAS) * 100)}%
          </span>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 99, width: `${(etapa / TOTAL_ETAPAS) * 100}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 20 }}>
          {erro}
        </div>
      )}

      {/* Etapa 1 — Dados pessoais */}
      {etapa === 1 && (
        <div className="fade-in">
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Olá! Vamos começar.</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Precisamos de alguns dados para calcular sua dieta.</p>

          <div className="form-group">
            <label className="form-label">Seu nome</label>
            <input placeholder="Como posso te chamar?" value={dados.nome} onChange={e => set('nome', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Peso atual (kg)</label>
              <input type="number" placeholder="Ex: 90" value={dados.peso} onChange={e => set('peso', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Altura (cm)</label>
              <input type="number" placeholder="Ex: 175" value={dados.altura} onChange={e => set('altura', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Idade</label>
              <input type="number" placeholder="Ex: 31" value={dados.idade} onChange={e => set('idade', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gênero</label>
              <select value={dados.genero} onChange={e => set('genero', e.target.value)}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Etapa 2 — Objetivo */}
      {etapa === 2 && (
        <div className="fade-in">
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Qual é seu objetivo?</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Isso define sua meta calórica e distribuição de macros.</p>

          {[
            { val: 'perder', label: 'Perder gordura', sub: 'Reduzir % de gordura mantendo músculo' },
            { val: 'ganhar', label: 'Ganhar massa', sub: 'Aumentar músculo com proteína elevada' },
            { val: 'manter', label: 'Manter e melhorar', sub: 'Recomposição corporal e saúde geral' },
          ].map(op => (
            <button
              key={op.val}
              onClick={() => set('objetivo', op.val)}
              style={{
                width: '100%', padding: '14px 16px', marginBottom: 10,
                background: dados.objetivo === op.val ? 'var(--accent-dim)' : 'var(--surface)',
                border: `1px solid ${dados.objetivo === op.val ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 500, color: dados.objetivo === op.val ? 'var(--accent)' : 'var(--text)', fontSize: 15 }}>{op.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{op.sub}</div>
            </button>
          ))}

          {dados.objetivo === 'perder' && dados.peso && dados.altura && (
            <div style={{ marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Peso meta (opcional)</label>
                <input
                  type="number"
                  placeholder={`Sugestão: ${estimarPesoMeta(parseFloat(dados.peso), parseFloat(dados.altura), 'perder')} kg`}
                  value={dados.pesoMeta}
                  onChange={e => set('pesoMeta', e.target.value)}
                />
                <span className="form-hint">Deixe em branco para usar o cálculo automático</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Etapa 3 — Atividade física */}
      {etapa === 3 && (
        <div className="fade-in">
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Sua rotina de exercícios</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Isso ajusta suas calorias e macros.</p>

          <div className="form-group">
            <label className="form-label">Nível de atividade</label>
            {[
              { val: 'sedentario', label: 'Sedentário', sub: 'Sem exercícios regulares' },
              { val: 'leve', label: 'Levemente ativo', sub: '1–2x por semana' },
              { val: 'moderado', label: 'Moderadamente ativo', sub: '3–4x por semana' },
              { val: 'ativo', label: 'Muito ativo', sub: '5x+ ou trabalho físico pesado' },
            ].map(op => (
              <button
                key={op.val}
                onClick={() => set('atividade', op.val)}
                style={{
                  width: '100%', padding: '12px 16px', marginBottom: 8,
                  background: dados.atividade === op.val ? 'var(--accent-dim)' : 'var(--surface2)',
                  border: `1px solid ${dados.atividade === op.val ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 500, color: dados.atividade === op.val ? 'var(--accent)' : 'var(--text)', fontSize: 14 }}>{op.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{op.sub}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div className="form-group">
              <label className="form-label">Tipo de treino</label>
              <select value={dados.treino_tipo} onChange={e => set('treino_tipo', e.target.value)}>
                <option value="musculacao">Musculação</option>
                <option value="cardio">Cardio</option>
                <option value="misto">Misto</option>
                <option value="esporte">Esporte</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Frequência (dias/sem)</label>
              <select value={dados.treino_freq} onChange={e => set('treino_freq', e.target.value)}>
                {['1','2','3','4','5','6','7'].map(n => <option key={n} value={n}>{n}x por semana</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Etapa 4 — Preview dos macros */}
      {etapa === 4 && macrosPreview && (
        <div className="fade-in">
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Sua dieta calculada</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
            Baseada no Lyon Protocol. Você pode ajustar a qualquer momento.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Proteína', val: `${macrosPreview.proteina}g`, cor: 'var(--accent)', sub: '1g/lb peso-alvo' },
              { label: 'Gordura', val: `${macrosPreview.gordura}g`, cor: 'var(--orange)', sub: '0.4×peso-alvo' },
              { label: 'Carboidrato', val: `${macrosPreview.carb}g`, cor: 'var(--blue)', sub: 'Base RDA' },
              { label: 'Calorias', val: `${macrosPreview.kcal}`, cor: '#a78bfa', sub: 'kcal/dia' },
            ].map(m => (
              <div key={m.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 6 }}>{m.label.toUpperCase()}</div>
                <div style={{ fontSize: 26, fontWeight: 600, color: m.cor }}>{m.val}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'var(--accent-dim)', borderColor: 'var(--accent)' }}>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>MARGEM LIVRE</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{macrosPreview.margemLivre} kcal/dia</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
              Calorias de sobra para comer fora da dieta sem culpa.
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Peso alvo:</strong> {macrosPreview.pesoAlvo}kg → proteína calculada em {Math.round(macrosPreview.pesoAlvo * 2.2046)}g (1g/lb)
          </div>
        </div>
      )}

      {/* Etapa 5 — Preferências alimentares */}
      {etapa === 5 && (
        <div className="fade-in">
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Preferências alimentares</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Assim as sugestões serão realistas para você.</p>

          <div className="form-group">
            <label className="form-label">Alimentos que não come ou quer evitar</label>
            <textarea
              placeholder="Ex: não como fígado, chuchu, abóbora..."
              value={dados.restricoes}
              onChange={e => set('restricoes', e.target.value)}
              rows={3}
              style={{ resize: 'none' }}
            />
            <span className="form-hint">Deixe em branco se não houver restrições</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Refeições por dia</label>
              <select value={dados.refeicoes_dia} onChange={e => set('refeicoes_dia', e.target.value)}>
                <option value="3">3 refeições</option>
                <option value="4">4 refeições</option>
                <option value="5">5 refeições</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tempo para cozinhar</label>
              <select value={dados.tempo_cozinhar} onChange={e => set('tempo_cozinhar', e.target.value)}>
                <option value="pouco">Pouco (prefiro rápido)</option>
                <option value="medio">Médio (cozinho às vezes)</option>
                <option value="muito">Bastante (gosto de cozinhar)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Etapa 6 — Confirmação */}
      {etapa === 6 && (
        <div className="fade-in">
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Tudo pronto, {dados.nome.split(' ')[0]}!</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>
            Sua dieta está configurada. A biblioteca já vem populada com refeições sugeridas.
          </p>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>RESUMO DO PERFIL</span>
            </div>
            {[
              { l: 'Nome', v: dados.nome },
              { l: 'Peso atual', v: `${dados.peso} kg` },
              { l: 'Objetivo', v: dados.objetivo === 'perder' ? 'Perder gordura' : dados.objetivo === 'ganhar' ? 'Ganhar massa' : 'Manter' },
              { l: 'Treino', v: `${dados.treino_freq}x/sem · ${dados.treino_tipo}` },
              { l: 'Refeições/dia', v: dados.refeicoes_dia },
            ].map(item => (
              <div key={item.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{item.l}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.v}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--accent)', lineHeight: 1.6 }}>
            Sua biblioteca começa com {BIBLIOTECA_PADRAO.length} refeições pré-configuradas. Você pode editar, adicionar e remover quando quiser.
          </div>
        </div>
      )}

      {/* Navegação */}
      <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
        {etapa > 1 && (
          <button className="btn btn-ghost" onClick={voltar} style={{ flex: '0 0 auto', minWidth: 100 }}>
            ← Voltar
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={avancar}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Salvando...' : etapa === TOTAL_ETAPAS ? 'Começar!' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}
