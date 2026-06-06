import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { interpretarRefeicao } from '../lib/ai'

const TIPOS_REFEICAO = [
  { val: 'cafe', label: 'Café da manhã', icon: '☀️', horario: '07:00' },
  { val: 'almoco', label: 'Almoço', icon: '🍽️', horario: '12:00' },
  { val: 'lanche', label: 'Lanche', icon: '🍎', horario: '15:00' },
  { val: 'jantar', label: 'Jantar', icon: '🌙', horario: '19:00' },
  { val: 'outro', label: 'Outro', icon: '➕', horario: '' },
]

export default function Registro() {
  const { perfil } = useAuth()
  const navigate = useNavigate()

  // Etapas: 'tipo' -> 'itens' -> 'confirmar'
  const [etapa, setEtapa] = useState('tipo')
  const [tipoSelecionado, setTipoSelecionado] = useState(null)
  const [horario, setHorario] = useState('')
  const [itens, setItens] = useState([]) // itens adicionados à refeição
  const [biblioteca, setBiblioteca] = useState([])
  const [busca, setBusca] = useState('')
  const [modo, setModo] = useState('biblioteca') // 'biblioteca' | 'texto'
  const [texto, setTexto] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [itemQtd, setItemQtd] = useState(null) // item aguardando definição de quantidade
  const [qtdInput, setQtdInput] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [nomePersonalizado, setNomePersonalizado] = useState('')

  const hoje = new Date().toISOString().slice(0, 10)

  useEffect(() => { carregarBiblioteca() }, [])

  async function carregarBiblioteca() {
    const { data } = await supabase
      .from('biblioteca')
      .select('*')
      .eq('user_id', perfil.user_id)
      .order('nome')
    setBiblioteca(data || [])
  }

  function selecionarTipo(tipo) {
    setTipoSelecionado(tipo)
    setHorario(tipo.horario)
    setEtapa('itens')
  }

  function abrirQuantidade(item) {
    setItemQtd(item)
    setQtdInput(item.qtd_base?.toString() || '100')
  }

  function confirmarQuantidade() {
    if (!itemQtd || !qtdInput) return
    const qtd = parseFloat(qtdInput)
    const base = itemQtd.qtd_base || 100
    const fator = qtd / base

    const itemFinal = {
      id: Date.now(),
      nome: itemQtd.nome,
      quantidade: qtd,
      proteina: Math.round(itemQtd.proteina * fator * 10) / 10,
      carb: Math.round(itemQtd.carb * fator * 10) / 10,
      gordura: Math.round(itemQtd.gordura * fator * 10) / 10,
      kcal: Math.round(itemQtd.kcal * fator),
      biblioteca_id: itemQtd.id,
    }

    setItens(prev => [...prev, itemFinal])
    setItemQtd(null)
    setQtdInput('')
  }

  function removerItem(id) {
    setItens(prev => prev.filter(i => i.id !== id))
  }

  async function interpretarTexto() {
    if (!texto.trim()) return
    setLoadingIA(true)
    const res = await interpretarRefeicao(texto, perfil)
    if (res?.itens) {
      const novos = res.itens.map((item, i) => ({
        id: Date.now() + i,
        nome: item.nome,
        quantidade: parseFloat(item.quantidade) || 100,
        proteina: item.proteina || 0,
        carb: item.carb || 0,
        gordura: item.gordura || 0,
        kcal: item.kcal || 0,
      }))
      setItens(prev => [...prev, ...novos])
    } else if (res?.total) {
      setItens(prev => [...prev, {
        id: Date.now(),
        nome: res.descricao || texto,
        quantidade: 1,
        proteina: res.total.proteina || 0,
        carb: res.total.carb || 0,
        gordura: res.total.gordura || 0,
        kcal: res.total.kcal || 0,
      }])
    }
    setTexto('')
    setLoadingIA(false)
  }

  const totais = itens.reduce((acc, i) => ({
    proteina: acc.proteina + i.proteina,
    carb: acc.carb + i.carb,
    gordura: acc.gordura + i.gordura,
    kcal: acc.kcal + i.kcal,
  }), { proteina: 0, carb: 0, gordura: 0, kcal: 0 })

  async function salvarRefeicao() {
    if (itens.length === 0) return
    setSalvando(true)
    try {
      const nome = nomePersonalizado || tipoSelecionado?.label || 'Refeição'
      const horaFinal = horario || new Date().toTimeString().slice(0, 5)

      await supabase.from('refeicoes').insert({
        user_id: perfil.user_id,
        data: hoje,
        nome,
        tipo: tipoSelecionado?.val || 'outro',
        horario: horaFinal,
        proteina: Math.round(totais.proteina),
        carb: Math.round(totais.carb),
        gordura: Math.round(totais.gordura),
        kcal: Math.round(totais.kcal),
        itens: JSON.stringify(itens),
      })

      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  async function salvarNaBiblioteca() {
    if (itens.length === 0) return
    const nome = nomePersonalizado || `${tipoSelecionado?.label} personalizado`
    await supabase.from('biblioteca').insert({
      user_id: perfil.user_id,
      nome,
      categoria: tipoSelecionado?.val || 'personalizado',
      proteina: Math.round(totais.proteina),
      carb: Math.round(totais.carb),
      gordura: Math.round(totais.gordura),
      kcal: Math.round(totais.kcal),
      qtd_base: 1,
      padrao: false,
    })
    alert('Refeição salva na biblioteca!')
  }

  const categorias = {
    cafe: '☀️ Café da manhã',
    almoco: '🍽️ Almoço / Janta',
    acomp: '🥗 Acompanhamentos',
    completo: '🥘 Pratos completos',
    lanche: '🍔 Lanches',
    leve: '🍎 Lanches leves',
    marmita: '📦 Marmitas',
    personalizado: '⭐ Minhas refeições',
    jantar: '🌙 Jantar',
    outro: '➕ Outros',
  }

  const bibliotecaFiltrada = biblioteca.filter(b =>
    b.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const porCategoria = bibliotecaFiltrada.reduce((acc, item) => {
    const cat = item.categoria || 'personalizado'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  // ─── ETAPA 1: Escolher tipo de refeição ───
  if (etapa === 'tipo') return (
    <div className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Nova refeição</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Qual refeição você vai registrar?</p>

      {TIPOS_REFEICAO.map(tipo => (
        <button
          key={tipo.val}
          onClick={() => selecionarTipo(tipo)}
          style={{
            width: '100%', padding: '16px', marginBottom: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <span style={{ fontSize: 24 }}>{tipo.icon}</span>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>{tipo.label}</div>
            {tipo.horario && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Horário sugerido: {tipo.horario}</div>}
          </div>
        </button>
      ))}
    </div>
  )

  // ─── ETAPA 2: Adicionar itens ───
  if (etapa === 'itens') return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button onClick={() => setEtapa('tipo')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>{tipoSelecionado?.icon} {tipoSelecionado?.label}</h2>
      </div>

      {/* Horário */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>Horário da refeição:</label>
        <input
          type="time"
          value={horario}
          onChange={e => setHorario(e.target.value)}
          style={{ width: 'auto', padding: '6px 10px', fontSize: 14 }}
        />
      </div>

      {/* Itens adicionados */}
      {itens.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-title">Itens adicionados ({itens.length})</div>
          {itens.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', background: 'var(--surface2)',
              borderRadius: 'var(--radius-sm)', marginBottom: 6,
              border: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.nome} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({item.quantidade}g)</span></div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  P:{item.proteina}g C:{item.carb}g G:{item.gordura}g {item.kcal}kcal
                </div>
              </div>
              <button onClick={() => removerItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '0 0 0 10px' }}>🗑</button>
            </div>
          ))}

          {/* Totais parciais */}
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
            {[
              { l: 'P', v: Math.round(totais.proteina), c: 'var(--accent)' },
              { l: 'C', v: Math.round(totais.carb), c: 'var(--blue)' },
              { l: 'G', v: Math.round(totais.gordura), c: 'var(--orange)' },
              { l: 'kcal', v: Math.round(totais.kcal), c: '#a78bfa' },
            ].map(m => (
              <div key={m.l} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: m.c }}>{m.v}{m.l !== 'kcal' ? 'g' : ''}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{m.l}</div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={() => setEtapa('confirmar')}>
            Confirmar refeição →
          </button>
        </div>
      )}

      {/* Modal de quantidade */}
      {itemQtd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 999,
        }}>
          <div style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 480 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{itemQtd.nome}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
              Base: {itemQtd.qtd_base || 100}g → P:{itemQtd.proteina}g C:{itemQtd.carb}g G:{itemQtd.gordura}g
            </div>
            <div className="form-group">
              <label className="form-label">Quantidade que você comeu (g)</label>
              <input
                type="number"
                value={qtdInput}
                onChange={e => setQtdInput(e.target.value)}
                autoFocus
                placeholder="Ex: 150"
              />
            </div>
            {qtdInput && (
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                → P:{Math.round(itemQtd.proteina * parseFloat(qtdInput) / (itemQtd.qtd_base || 100))}g{' '}
                C:{Math.round(itemQtd.carb * parseFloat(qtdInput) / (itemQtd.qtd_base || 100))}g{' '}
                G:{Math.round(itemQtd.gordura * parseFloat(qtdInput) / (itemQtd.qtd_base || 100))}g{' '}
                {Math.round(itemQtd.kcal * parseFloat(qtdInput) / (itemQtd.qtd_base || 100))}kcal
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setItemQtd(null)} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarQuantidade} style={{ flex: 2 }}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs biblioteca / texto */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 16 }}>
        {[{ val: 'biblioteca', label: '📚 Biblioteca' }, { val: 'texto', label: '✏️ Texto livre' }].map(t => (
          <button key={t.val} onClick={() => setModo(t.val)} style={{
            flex: 1, padding: '9px', border: 'none', borderRadius: 'var(--radius-sm)',
            background: modo === t.val ? 'var(--accent)' : 'transparent',
            color: modo === t.val ? '#111' : 'var(--text2)',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Modo texto */}
      {modo === 'texto' && (
        <div>
          <div className="form-group">
            <textarea
              placeholder="Ex: 200g de frango grelhado com brócolis e azeite..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={3}
              style={{ resize: 'none' }}
            />
          </div>
          <button className="btn btn-primary btn-full" onClick={interpretarTexto} disabled={loadingIA || !texto.trim()}>
            {loadingIA ? '🤖 Calculando...' : '🤖 Calcular e adicionar'}
          </button>
        </div>
      )}

      {/* Modo biblioteca */}
      {modo === 'biblioteca' && (
        <div>
          <div className="form-group">
            <input placeholder="Buscar alimento..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          {Object.entries(porCategoria).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div className="section-title">{categorias[cat] || cat}</div>
              {items.map(item => (
                <div
                  key={item.id}
                  className="card"
                  style={{ marginBottom: 6, cursor: 'pointer', padding: '10px 14px' }}
                  onClick={() => abrirQuantidade({ ...item, qtd_base: item.qtd_base || 100 })}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{item.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                        P:{item.proteina}g C:{item.carb}g G:{item.gordura}g {item.kcal}kcal
                        <span style={{ color: 'var(--text3)', marginLeft: 6 }}>/ {item.qtd_base || 100}g</span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--accent)', fontSize: 20, paddingLeft: 8 }}>+</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {bibliotecaFiltrada.length === 0 && (
            <div className="empty-state"><div className="empty-icon">🔍</div><div>Nenhum alimento encontrado.</div></div>
          )}
        </div>
      )}
    </div>
  )

  // ─── ETAPA 3: Confirmar ───
  if (etapa === 'confirmar') return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setEtapa('itens')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Confirmar refeição</h2>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{tipoSelecionado?.icon} {tipoSelecionado?.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>🕐 {horario || 'Horário não definido'}</div>
          </div>
        </div>

        {/* Nome personalizado */}
        <div className="form-group">
          <label className="form-label">Nome da refeição (opcional)</label>
          <input
            placeholder={tipoSelecionado?.label}
            value={nomePersonalizado}
            onChange={e => setNomePersonalizado(e.target.value)}
          />
        </div>

        {/* Itens */}
        <div className="section-title" style={{ marginTop: 8 }}>Itens ({itens.length})</div>
        {itens.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <span>{item.nome} <span style={{ color: 'var(--text3)' }}>({item.quantidade}g)</span></span>
            <span style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.kcal}kcal</span>
          </div>
        ))}

        {/* Totais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
          {[
            { l: 'Proteína', v: Math.round(totais.proteina), u: 'g', c: 'var(--accent)' },
            { l: 'Carbo', v: Math.round(totais.carb), u: 'g', c: 'var(--blue)' },
            { l: 'Gordura', v: Math.round(totais.gordura), u: 'g', c: 'var(--orange)' },
            { l: 'Kcal', v: Math.round(totais.kcal), u: '', c: '#a78bfa' },
          ].map(m => (
            <div key={m.l} style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '8px 4px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: m.c }}>{m.v}{m.u}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-secondary btn-full" style={{ marginBottom: 8 }} onClick={salvarNaBiblioteca}>
        💾 Salvar também na biblioteca
      </button>
      <button className="btn btn-primary btn-full" onClick={salvarRefeicao} disabled={salvando}>
        {salvando ? 'Salvando...' : '✓ Confirmar e salvar'}
      </button>
    </div>
  )

  return null
}
