import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { interpretarRefeicao } from '../lib/ai'

export default function Registro() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [modo, setModo] = useState('texto') // 'texto' | 'biblioteca'
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [biblioteca, setBiblioteca] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const hoje = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    carregarBiblioteca()
  }, [])

  async function carregarBiblioteca() {
    const { data } = await supabase
      .from('biblioteca')
      .select('*')
      .eq('user_id', perfil.user_id)
      .order('nome')
    setBiblioteca(data || [])
  }

  async function interpretar() {
    if (!texto.trim()) return
    setLoading(true)
    setResultado(null)
    const res = await interpretarRefeicao(texto, perfil)
    if (res) {
      setResultado(res)
    } else {
      // Fallback manual se IA não disponível
      setResultado({
        descricao: texto,
        total: { proteina: 0, carb: 0, gordura: 0, kcal: 0 },
        confianca: 'baixa',
        manual: true,
      })
    }
    setLoading(false)
  }

  async function salvarRefeicao(dados) {
    setSalvando(true)
    try {
      await supabase.from('refeicoes').insert({
        user_id: perfil.user_id,
        data: hoje,
        nome: dados.nome || dados.descricao,
        proteina: Math.round(dados.proteina || dados.total?.proteina || 0),
        carb: Math.round(dados.carb || dados.total?.carb || 0),
        gordura: Math.round(dados.gordura || dados.total?.gordura || 0),
        kcal: Math.round(dados.kcal || dados.total?.kcal || 0),
        texto_original: texto || null,
      })
      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  async function salvarNaBiblioteca() {
    if (!resultado) return
    await supabase.from('biblioteca').insert({
      user_id: perfil.user_id,
      nome: resultado.descricao,
      categoria: 'personalizado',
      proteina: Math.round(resultado.total.proteina),
      carb: Math.round(resultado.total.carb),
      gordura: Math.round(resultado.total.gordura),
      kcal: Math.round(resultado.total.kcal),
      padrao: false,
    })
    alert('Salvo na biblioteca!')
  }

  const bibliotecaFiltrada = biblioteca.filter(b =>
    b.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const categorias = {
    cafe: 'Café da manhã',
    almoco: 'Almoço / Janta',
    acomp: 'Acompanhamentos',
    completo: 'Pratos completos',
    lanche: 'Lanches',
    leve: 'Lanches leves',
    personalizado: 'Minhas refeições',
    marmita: 'Marmitas',
  }

  const porCategoria = bibliotecaFiltrada.reduce((acc, item) => {
    const cat = item.categoria || 'personalizado'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Registrar refeição</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
        Descreva o que comeu ou escolha da biblioteca.
      </p>

      {/* Modo tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 24 }}>
        {[
          { val: 'texto', label: '✏️ Texto livre' },
          { val: 'biblioteca', label: '📚 Biblioteca' },
        ].map(t => (
          <button
            key={t.val}
            onClick={() => { setModo(t.val); setResultado(null) }}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: 'var(--radius-sm)',
              background: modo === t.val ? 'var(--accent)' : 'transparent',
              color: modo === t.val ? '#111' : 'var(--text2)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Modo texto */}
      {modo === 'texto' && (
        <div>
          <div className="form-group">
            <label className="form-label">Descreva sua refeição</label>
            <textarea
              placeholder="Ex: 200g de frango grelhado, 4 col. de arroz branco, 1 concha de feijão e salada..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={4}
              style={{ resize: 'none' }}
            />
            <span className="form-hint">Quanto mais detalhado, mais preciso o cálculo.</span>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={interpretar}
            disabled={loading || !texto.trim()}
          >
            {loading ? '🤖 Calculando macros...' : '🤖 Calcular macros'}
          </button>

          {/* Resultado */}
          {resultado && (
            <div style={{ marginTop: 20 }} className="slide-up">
              <div className="section-title">Resultado</div>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 500, marginBottom: 12 }}>{resultado.descricao}</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                  {[
                    { l: 'Proteína', v: resultado.total.proteina, u: 'g', c: 'var(--accent)' },
                    { l: 'Carbo', v: resultado.total.carb, u: 'g', c: 'var(--blue)' },
                    { l: 'Gordura', v: resultado.total.gordura, u: 'g', c: 'var(--orange)' },
                    { l: 'Kcal', v: resultado.total.kcal, u: '', c: '#a78bfa' },
                  ].map(m => (
                    <div key={m.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: m.c }}>
                        {Math.round(m.v)}{m.u}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{m.l}</div>
                    </div>
                  ))}
                </div>

                {resultado.confianca === 'baixa' && (
                  <div style={{ fontSize: 12, color: 'var(--orange)', background: 'var(--orange-dim)', padding: '8px 12px', borderRadius: 'var(--radius-xs)', marginBottom: 10 }}>
                    ⚠️ Estimativa aproximada. Confirme os valores antes de salvar.
                  </div>
                )}

                {/* Edição manual se baixa confiança */}
                {resultado.manual && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {['proteina', 'carb', 'gordura', 'kcal'].map(k => (
                      <div key={k}>
                        <label className="form-label">{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                        <input
                          type="number"
                          value={resultado.total[k]}
                          onChange={e => setResultado(prev => ({
                            ...prev,
                            total: { ...prev.total, [k]: parseFloat(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={salvarNaBiblioteca}
                  style={{ flex: '0 0 auto' }}
                >
                  + Biblioteca
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => salvarRefeicao(resultado.total ? { ...resultado.total, descricao: resultado.descricao } : resultado)}
                  disabled={salvando}
                  style={{ flex: 1 }}
                >
                  {salvando ? 'Salvando...' : '✓ Confirmar e salvar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modo biblioteca */}
      {modo === 'biblioteca' && (
        <div>
          <div className="form-group">
            <input
              placeholder="Buscar refeição..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          {Object.entries(porCategoria).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div className="section-title">{categorias[cat] || cat}</div>
              {items.map(item => (
                <div
                  key={item.id}
                  className="card"
                  style={{ marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onClick={() => salvarRefeicao(item)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{item.nome}</div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--accent)' }}>P: {item.proteina}g</span>
                        <span style={{ color: 'var(--blue)' }}>C: {item.carb}g</span>
                        <span style={{ color: 'var(--orange)' }}>G: {item.gordura}g</span>
                        <span style={{ color: '#a78bfa' }}>{item.kcal}kcal</span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--accent)', fontSize: 20 }}>+</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {bibliotecaFiltrada.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div>Nenhuma refeição encontrada.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
