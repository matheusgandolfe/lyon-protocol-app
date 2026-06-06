import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Biblioteca() {
  const { perfil } = useAuth()
  const [biblioteca, setBiblioteca] = useState([])
  const [busca, setBusca] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [nova, setNova] = useState({ nome: '', categoria: 'personalizado', proteina: '', carb: '', gordura: '', kcal: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregarBiblioteca() }, [])

  async function carregarBiblioteca() {
    const { data } = await supabase
      .from('biblioteca')
      .select('*')
      .eq('user_id', perfil.user_id)
      .order('nome')
    setBiblioteca(data || [])
  }

  async function salvarNova() {
    if (!nova.nome) return
    setSalvando(true)
    // Auto-calcular kcal se não preenchido
    const kcal = nova.kcal || Math.round((nova.proteina || 0) * 4 + (nova.carb || 0) * 4 + (nova.gordura || 0) * 9)
    await supabase.from('biblioteca').insert({
      user_id: perfil.user_id,
      nome: nova.nome,
      categoria: nova.categoria,
      proteina: parseFloat(nova.proteina) || 0,
      carb: parseFloat(nova.carb) || 0,
      gordura: parseFloat(nova.gordura) || 0,
      kcal: parseFloat(kcal) || 0,
      padrao: false,
    })
    setNova({ nome: '', categoria: 'personalizado', proteina: '', carb: '', gordura: '', kcal: '' })
    setAdicionando(false)
    setSalvando(false)
    carregarBiblioteca()
  }

  async function excluir(id) {
    await supabase.from('biblioteca').delete().eq('id', id)
    setBiblioteca(prev => prev.filter(b => b.id !== id))
  }

  const filtrada = biblioteca.filter(b => b.nome.toLowerCase().includes(busca.toLowerCase()))

  const categorias = {
    cafe: '☀️ Café da manhã',
    almoco: '🍽️ Almoço / Janta',
    acomp: '🥗 Acompanhamentos',
    completo: '🥘 Pratos completos',
    lanche: '🍔 Lanches',
    leve: '🍎 Lanches leves',
    marmita: '📦 Marmitas',
    personalizado: '⭐ Minhas refeições',
  }

  const porCategoria = filtrada.reduce((acc, item) => {
    const cat = item.categoria || 'personalizado'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Biblioteca</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{biblioteca.length} refeições salvas</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAdicionando(true)}>+ Adicionar</button>
      </div>

      <div className="form-group">
        <input placeholder="Buscar refeição..." value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {/* Formulário nova refeição */}
      {adicionando && (
        <div className="card slide-up" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 500, marginBottom: 16 }}>Nova refeição</div>

          <div className="form-group">
            <label className="form-label">Nome</label>
            <input placeholder="Ex: Frango grelhado 200g" value={nova.nome} onChange={e => setNova(p => ({ ...p, nome: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select value={nova.categoria} onChange={e => setNova(p => ({ ...p, categoria: e.target.value }))}>
              {Object.entries(categorias).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { k: 'proteina', l: 'Proteína (g)' },
              { k: 'carb', l: 'Carbo (g)' },
              { k: 'gordura', l: 'Gordura (g)' },
              { k: 'kcal', l: 'Kcal (opcional)' },
            ].map(f => (
              <div key={f.k} className="form-group">
                <label className="form-label">{f.l}</label>
                <input type="number" placeholder="0" value={nova[f.k]} onChange={e => setNova(p => ({ ...p, [f.k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <span className="form-hint" style={{ display: 'block', marginBottom: 16 }}>Kcal calculada automaticamente se deixado em branco.</span>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setAdicionando(false)} style={{ flex: 1 }}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvarNova} disabled={salvando || !nova.nome} style={{ flex: 2 }}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista por categoria */}
      {Object.entries(porCategoria).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div className="section-title">{categorias[cat] || cat}</div>
          {items.map(item => (
            <div key={item.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 5 }}>{item.nome}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--accent)' }}>P: {item.proteina}g</span>
                    <span style={{ color: 'var(--blue)' }}>C: {item.carb}g</span>
                    <span style={{ color: 'var(--orange)' }}>G: {item.gordura}g</span>
                    <span style={{ color: '#a78bfa' }}>{item.kcal}kcal</span>
                  </div>
                </div>
                {!item.padrao && (
                  <button onClick={() => excluir(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '0 0 0 12px' }}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {filtrada.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <div>Nenhuma refeição encontrada.</div>
        </div>
      )}
    </div>
  )
}
