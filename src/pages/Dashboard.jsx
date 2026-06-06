import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { calcularSaldo } from '../lib/lyon'
import { gerarSugestoes } from '../lib/ai'

export default function Dashboard() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [refeicoes, setRefeicoes] = useState([])
  const [biblioteca, setBiblioteca] = useState([])
  const [sugestoes, setSugestoes] = useState(null)
  const [loadingSug, setLoadingSug] = useState(false)
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const hoje = new Date().toISOString().slice(0, 10)

  const macrosMeta = perfil?.macros ? JSON.parse(perfil.macros) : { proteina: 176, gordura: 70, carb: 130, kcal: 1750 }

  useEffect(() => {
    if (perfil) {
      carregarRefeicoes()
      carregarBiblioteca()
    }
  }, [perfil])

  async function carregarRefeicoes() {
    const { data } = await supabase
      .from('refeicoes')
      .select('*')
      .eq('user_id', perfil.user_id)
      .eq('data', hoje)
      .order('created_at', { ascending: true })
    setRefeicoes(data || [])
  }

  async function carregarBiblioteca() {
    const { data } = await supabase
      .from('biblioteca')
      .select('*')
      .eq('user_id', perfil.user_id)
      .limit(20)
    setBiblioteca(data || [])
  }

  async function excluirRefeicao(id) {
    await supabase.from('refeicoes').delete().eq('id', id)
    setRefeicoes(prev => prev.filter(r => r.id !== id))
  }

  async function buscarSugestoes() {
    setLoadingSug(true)
    setMostrarSugestoes(true)
    const { falta } = calcularSaldo(macrosMeta, refeicoes)
    const hora = new Date().getHours()
    const horario = hora < 12 ? 'manhã' : hora < 18 ? 'tarde' : 'noite'
    const result = await gerarSugestoes(falta, biblioteca, horario)
    setSugestoes(result)
    setLoadingSug(false)
  }

  const { consumido, falta, progresso } = calcularSaldo(macrosMeta, refeicoes)

  const MACROS = [
    { key: 'proteina', label: 'Proteína', cor: 'var(--accent)', cor2: '#c8f54233' },
    { key: 'carb', label: 'Carbo', cor: 'var(--blue)', cor2: '#5c9fff33' },
    { key: 'gordura', label: 'Gordura', cor: 'var(--orange)', cor2: '#f5a64233' },
    { key: 'kcal', label: 'Kcal', cor: '#a78bfa', cor2: '#a78bfa33' },
  ]

  const agora = new Date()
  const saudacao = agora.getHours() < 12 ? 'Bom dia' : agora.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', marginBottom: 4 }}>
          {agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>
          {saudacao}, {perfil?.nome?.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Macros do dia */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-title">Macros do dia</div>
        <div className="card">
          {MACROS.map(m => (
            <div key={m.key} style={{ marginBottom: m.key === 'kcal' ? 0 : 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{m.label}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: m.cor }}>
                    {consumido[m.key]}{m.key === 'kcal' ? '' : 'g'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    / {macrosMeta[m.key]}{m.key === 'kcal' ? ' kcal' : 'g'}
                  </span>
                </div>
              </div>
              <div className="macro-bar-wrap">
                <div
                  className={`macro-bar macro-bar-${m.key}`}
                  style={{ width: `${progresso[m.key]}%`, background: m.cor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Falta hoje */}
      {falta.proteina > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-title">O que ainda falta</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {MACROS.map(m => (
              <div key={m.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: falta[m.key] > 0 ? m.cor : 'var(--accent)' }}>
                  {falta[m.key] > 0 ? falta[m.key] : '✓'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                  {falta[m.key] > 0 ? (m.key === 'kcal' ? 'kcal' : 'g') : 'ok'}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>
                  {m.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 12 }}
            onClick={buscarSugestoes}
            disabled={loadingSug}
          >
            {loadingSug ? 'Buscando sugestões...' : '🤖 O que devo comer agora?'}
          </button>
        </div>
      )}

      {/* Meta batida */}
      {falta.proteina === 0 && refeicoes.length > 0 && (
        <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🎯</div>
          <div style={{ fontWeight: 600, color: 'var(--accent)' }}>Meta de proteína batida!</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Ótimo trabalho hoje.</div>
        </div>
      )}

      {/* Sugestões da IA */}
      {mostrarSugestoes && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Sugestões para hoje</div>
          {loadingSug ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14, padding: 24 }}>
              Calculando o que falta...
            </div>
          ) : sugestoes ? (
            <>
              {sugestoes.mensagem && (
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, fontStyle: 'italic' }}>
                  {sugestoes.mensagem}
                </div>
              )}
              {sugestoes.sugestoes?.map((s, i) => (
                <div key={i} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{s.nome}</span>
                    {s.daBiblioteca && <span className="tag tag-accent" style={{ fontSize: 10 }}>biblioteca</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>{s.descricao}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--accent)' }}>P: {s.macros.proteina}g</span>
                    <span style={{ color: 'var(--blue)' }}>C: {s.macros.carb}g</span>
                    <span style={{ color: 'var(--orange)' }}>G: {s.macros.gordura}g</span>
                    <span style={{ color: '#a78bfa' }}>{s.macros.kcal}kcal</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="card" style={{ fontSize: 13, color: 'var(--text2)' }}>
              Configure sua chave de IA para receber sugestões personalizadas.
            </div>
          )}
        </div>
      )}

      {/* Refeições do dia */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Refeições de hoje</div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/registro')}>
            + Registrar
          </button>
        </div>

        {refeicoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <div>Nenhuma refeição registrada ainda.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/registro')}>
              Registrar primeira refeição
            </button>
          </div>
        ) : (
          refeicoes.map(r => (
            <div key={r.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{r.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
                <button
                  onClick={() => excluirRefeicao(r.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '0 0 0 8px' }}
                >
                  🗑
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--accent)' }}>P: {r.proteina}g</span>
                <span style={{ color: 'var(--blue)' }}>C: {r.carb}g</span>
                <span style={{ color: 'var(--orange)' }}>G: {r.gordura}g</span>
                <span style={{ color: '#a78bfa' }}>{r.kcal}kcal</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
