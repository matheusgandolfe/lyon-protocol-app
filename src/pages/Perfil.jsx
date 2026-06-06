import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { calcularMacros, estimarPesoMeta } from '../lib/lyon'

export default function Perfil() {
  const { perfil, salvarPerfil, logout } = useAuth()
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [dados, setDados] = useState({
    nome: perfil?.nome || '',
    peso: perfil?.peso || '',
    altura: perfil?.altura || '',
    idade: perfil?.idade || '',
    genero: perfil?.genero || 'masculino',
    objetivo: perfil?.objetivo || 'perder',
    atividade: perfil?.atividade || 'moderado',
    treino_tipo: perfil?.treino_tipo || 'musculacao',
    treino_freq: perfil?.treino_freq || '4',
    restricoes: perfil?.restricoes || '',
    refeicoes_dia: perfil?.refeicoes_dia || '3',
    tempo_cozinhar: perfil?.tempo_cozinhar || 'pouco',
    peso_meta: perfil?.peso_meta || '',
  })

  const set = (k, v) => setDados(p => ({ ...p, [k]: v }))

  const macros = perfil?.macros ? JSON.parse(perfil.macros) : null

  async function salvar() {
    setSalvando(true)
    try {
      const pesoNum = parseFloat(dados.peso)
      const altNum = parseFloat(dados.altura)
      const idadeNum = parseInt(dados.idade)
      const pesoMeta = dados.peso_meta ? parseFloat(dados.peso_meta) : estimarPesoMeta(pesoNum, altNum, dados.objetivo)

      const novosMacros = calcularMacros({
        peso: pesoNum, altura: altNum, idade: idadeNum,
        genero: dados.genero, objetivo: dados.objetivo,
        atividade: dados.atividade, pesoMeta,
      })

      await salvarPerfil({
        ...dados,
        peso: pesoNum,
        altura: altNum,
        idade: idadeNum,
        peso_meta: pesoMeta,
        macros: JSON.stringify(novosMacros),
      })
      setEditando(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const MACROS_DISPLAY = macros ? [
    { label: 'Proteína', val: `${macros.proteina}g`, cor: 'var(--accent)' },
    { label: 'Gordura', val: `${macros.gordura}g`, cor: 'var(--orange)' },
    { label: 'Carboidrato', val: `${macros.carb}g`, cor: 'var(--blue)' },
    { label: 'Calorias', val: `${macros.kcal} kcal`, cor: '#a78bfa' },
    { label: 'Margem livre', val: `${macros.margemLivre} kcal`, cor: 'var(--green)' },
  ] : []

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Perfil</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{perfil?.nome}</p>
        </div>
        {!editando && (
          <button className="btn btn-secondary btn-sm" onClick={() => setEditando(true)}>Editar</button>
        )}
      </div>

      {/* Macros atuais */}
      {macros && !editando && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Suas metas diárias</div>
          <div className="card">
            {MACROS_DISPLAY.map(m => (
              <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>{m.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: m.cor }}>{m.val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: 14, color: 'var(--text2)' }}>Peso alvo</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500 }}>{macros.pesoAlvo} kg</span>
            </div>
          </div>
        </div>
      )}

      {/* Info do perfil (leitura) */}
      {!editando && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Dados pessoais</div>
          <div className="card">
            {[
              { l: 'Peso atual', v: `${perfil?.peso} kg` },
              { l: 'Altura', v: `${perfil?.altura} cm` },
              { l: 'Idade', v: `${perfil?.idade} anos` },
              { l: 'Gênero', v: perfil?.genero === 'masculino' ? 'Masculino' : 'Feminino' },
              { l: 'Objetivo', v: perfil?.objetivo === 'perder' ? 'Perder gordura' : perfil?.objetivo === 'ganhar' ? 'Ganhar massa' : 'Manter' },
              { l: 'Atividade', v: { sedentario: 'Sedentário', leve: 'Leve', moderado: 'Moderado', ativo: 'Muito ativo' }[perfil?.atividade] || perfil?.atividade },
              { l: 'Treino', v: `${perfil?.treino_freq}x/sem · ${perfil?.treino_tipo}` },
              { l: 'Refeições/dia', v: perfil?.refeicoes_dia },
            ].map(item => (
              <div key={item.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>{item.l}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.v}</span>
              </div>
            ))}
            {perfil?.restricoes && (
              <div style={{ padding: '10px 0' }}>
                <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>Restrições</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{perfil.restricoes}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulário de edição */}
      {editando && (
        <div className="slide-up">
          <div className="section-title">Editar dados</div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input value={dados.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input type="number" value={dados.peso} onChange={e => set('peso', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Altura (cm)</label>
                <input type="number" value={dados.altura} onChange={e => set('altura', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Idade</label>
                <input type="number" value={dados.idade} onChange={e => set('idade', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gênero</label>
                <select value={dados.genero} onChange={e => set('genero', e.target.value)}>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Objetivo</label>
              <select value={dados.objetivo} onChange={e => set('objetivo', e.target.value)}>
                <option value="perder">Perder gordura</option>
                <option value="ganhar">Ganhar massa</option>
                <option value="manter">Manter e melhorar</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Peso meta (kg)</label>
              <input type="number" placeholder="Automático se vazio" value={dados.peso_meta} onChange={e => set('peso_meta', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nível de atividade</label>
              <select value={dados.atividade} onChange={e => set('atividade', e.target.value)}>
                <option value="sedentario">Sedentário</option>
                <option value="leve">Levemente ativo</option>
                <option value="moderado">Moderadamente ativo</option>
                <option value="ativo">Muito ativo</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                <label className="form-label">Frequência</label>
                <select value={dados.treino_freq} onChange={e => set('treino_freq', e.target.value)}>
                  {['1','2','3','4','5','6','7'].map(n => <option key={n} value={n}>{n}x/sem</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Restrições alimentares</label>
              <textarea value={dados.restricoes} onChange={e => set('restricoes', e.target.value)} rows={2} style={{ resize: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setEditando(false)} style={{ flex: 1 }}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ flex: 2 }}>
              {salvando ? 'Salvando...' : 'Salvar e recalcular macros'}
            </button>
          </div>
        </div>
      )}

      {/* Logout */}
      {!editando && (
        <div style={{ marginTop: 32 }}>
          <button className="btn btn-danger btn-full" onClick={logout}>
            Sair da conta
          </button>
        </div>
      )}
    </div>
  )
}
