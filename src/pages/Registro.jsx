import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { interpretarRefeicao } from '../lib/ai'

const TIPOS_REFEICAO = [
  { val: 'cafe', label: 'Café da manhã', icon: '☀️', horario: '07:00', cats: ['proteina', 'queijo', 'pao', 'fruta', 'bebida'] },
  { val: 'almoco', label: 'Almoço', icon: '🍽️', horario: '12:00', cats: ['proteina', 'acomp', 'vegetal', 'gordura'] },
  { val: 'lanche', label: 'Lanche', icon: '🍎', horario: '15:00', cats: ['fruta', 'proteina', 'pao', 'bebida'] },
  { val: 'jantar', label: 'Jantar', icon: '🌙', horario: '19:00', cats: ['proteina', 'acomp', 'vegetal', 'pao', 'gordura'] },
  { val: 'outro', label: 'Outro', icon: '➕', horario: '', cats: [] },
]

const LABEL_CATS = {
  proteina: 'Proteínas',
  queijo: 'Queijos e laticínios',
  pao: 'Pães e massas',
  acomp: 'Arroz, grãos e acompanhamentos',
  vegetal: 'Vegetais',
  fruta: 'Frutas',
  gordura: 'Gorduras',
  bebida: 'Bebidas',
  personalizado: 'Minhas refeições',
  marmita: 'Marmitas',
}

function labelUnidade(unidade, qtd) {
  const n = parseFloat(qtd) || 1
  switch (unidade) {
    case 'g': return `${n}g`
    case 'unidade': return n === 1 ? '1 unidade' : `${n} unidades`
    case 'fatia': return n === 1 ? '1 fatia' : `${n} fatias`
    case 'colher': return n === 1 ? '1 col. sopa' : `${n} col. sopa`
    case 'concha': return n === 1 ? '1 concha' : `${n} conchas`
    case 'copo': return n === 1 ? '1 copo' : `${n} copos`
    case 'scoop': return n === 1 ? '1 scoop' : `${n} scoops`
    default: return `${n} ${unidade}`
  }
}

function placeholderUnidade(unidade) {
  switch (unidade) {
    case 'g': return 'Quantidade em gramas'
    case 'unidade': return 'Quantas unidades?'
    case 'fatia': return 'Quantas fatias?'
    case 'colher': return 'Quantas colheres?'
    case 'concha': return 'Quantas conchas?'
    case 'copo': return 'Quantos copos?'
    case 'scoop': return 'Quantos scoops?'
    default: return 'Quantidade'
  }
}

export default function Registro() {
  const { perfil } = useAuth()
  const navigate = useNavigate()

  const [etapa, setEtapa] = useState('tipo')
  const [tipoSelecionado, setTipoSelecionado] = useState(null)
  const [horario, setHorario] = useState('')
  const [itens, setItens] = useState([])
  const [biblioteca, setBiblioteca] = useState([])
  const [busca, setBusca] = useState('')
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const [modo, setModo] = useState('biblioteca')
  const [texto, setTexto] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [itemQtd, setItemQtd] = useState(null)
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
    setMostrarTodas(false)
    setBusca('')
    setEtapa('itens')
  }

  function abrirQuantidade(item) {
    setItemQtd(item)
    setQtdInput(item.unidade === 'g' ? '100' : '1')
  }

  function calcularMacrosQtd(item, qtd) {
    const q = parseFloat(qtd) || 0
    const base = item.qtd_base || 1
    const fator = item.unidade === 'g' ? q / base : q
    return {
      proteina: Math.round(item.proteina * fator * 10) / 10,
      carb: Math.round(item.carb * fator * 10) / 10,
      gordura: Math.round(item.gordura * fator * 10) / 10,
      kcal: Math.round(item.kcal * fator),
    }
  }

  function confirmarQuantidade() {
    if (!itemQtd || !qtdInput) return
    const macros = calcularMacrosQtd(itemQtd, qtdInput)
    const itemFinal = {
      id: Date.now(),
      nome: itemQtd.nome,
      quantidade: parseFloat(qtdInput),
      unidade: itemQtd.unidade || 'g',
      ...macros,
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
        unidade: 'g',
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
        unidade: 'unidade',
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
    proteina: acc.proteina + (i.proteina || 0),
    carb: acc.carb + (i.carb || 0),
    gordura: acc.gordura + (i.gordura || 0),
    kcal: acc.kcal + (i.kcal || 0),
  }), { proteina: 0, carb: 0, gordura: 0, kcal: 0 })

  async function salvarRefeicao() {
    if (itens.length === 0) return
    setSalvando(true)
    try {
      const nome = nomePersonalizado || tipoSelecionado?.label || 'Refeição'
      await supabase.from('refeicoes').insert({
        user_id: perfil.user_id,
        data: hoje,
        nome,
        tipo: tipoSelecionado?.val || 'outro',
        horario: horario || new Date().toTimeString().slice(0, 5),
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
      unidade: 'unidade',
      padrao: false,
    })
    alert('Salvo na biblioteca!')
  }

  // Filtra biblioteca por categorias do tipo OU busca
  const bibliotecaFiltrada = biblioteca.filter(b => {
    const matchBusca = b.nome.toLowerCase().includes(busca.toLowerCase())
    if (busca) return matchBusca
    if (mostrarTodas || !tipoSelecionado || tipoSelecionado.cats.length === 0) return true
    return tipoSelecionado.cats.includes(b.categoria)
  })

  const porCategoria = bibliotecaFiltrada.reduce((acc, item) => {
    const cat = item.categoria || 'personalizado'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const macrosPreview = itemQtd && qtdInput ? calcularMacrosQtd(itemQtd, qtdInput) : null

  // ─── ETAPA 1 ───
  if (etapa === 'tipo') return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Nova refeição</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Qual refeição você vai registrar?</p>

      {TIPOS_REFEICAO.map(tipo => (
        <button key={tipo.val} onClick={() => selecionarTipo(tipo)} style={{
          width: '100%', padding: '14px 16px', marginBottom: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <span style={{ fontSize: 22 }}>{tipo.icon}</span>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>{tipo.label}</div>
            {tipo.horario && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Horário sugerido: {tipo.horario}</div>}
          </div>
        </button>
      ))}
    </div>
  )

  // ─── ETAPA 2 ───
  if (etapa === 'itens') return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={() => setEtapa('tipo')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, padding: '4px 0' }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>{tipoSelecionado?.icon} {tipoSelecionado?.label}</h2>
      </div>

      {/* Horário */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>🕐 Horário:</span>
        <input type="time" value={horario} onChange={e => setHorario(e.target.value)}
          style={{ width: 'auto', padding: '2px 6px', fontSize: 13, border: 'none', background: 'transparent', color: 'var(--accent)' }} />
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>pode editar</span>
      </div>

      {/* Itens adicionados */}
      {itens.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="section-title">Na refeição ({itens.length} itens)</div>
          {itens.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', background: 'var(--surface2)',
              borderRadius: 'var(--radius-sm)', marginBottom: 4,
              border: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginRight: 6 }}>
                    {labelUnidade(item.unidade, item.quantidade)}
                  </span>
                  {item.nome}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                  P:{item.proteina}g C:{item.carb}g G:{item.gordura}g · {item.kcal}kcal
                </div>
              </div>
              <button onClick={() => removerItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '0 0 0 8px', fontSize: 14 }}>✕</button>
            </div>
          ))}

          {/* Totais */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, padding: '8px 10px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            {[
              { l: 'P', v: Math.round(totais.proteina), c: 'var(--accent)' },
              { l: 'C', v: Math.round(totais.carb), c: 'var(--blue)' },
              { l: 'G', v: Math.round(totais.gordura), c: 'var(--orange)' },
              { l: 'kcal', v: Math.round(totais.kcal), c: 'var(--text2)' },
            ].map(m => (
              <div key={m.l} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: m.c }}>{m.v}{m.l !== 'kcal' ? 'g' : ''}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>{m.l.toUpperCase()}</div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-full" style={{ marginTop: 10 }} onClick={() => setEtapa('confirmar')}>
            Confirmar refeição →
          </button>
        </div>
      )}

      {/* Modal quantidade */}
      {itemQtd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--surface)', borderRadius: '16px 16px 0 0', padding: '20px', width: '100%', maxWidth: 480 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{itemQtd.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
              Por {itemQtd.unidade === 'g' ? `${itemQtd.qtd_base}g` : `${labelUnidade(itemQtd.unidade, 1)}`}: P:{itemQtd.proteina}g C:{itemQtd.carb}g G:{itemQtd.gordura}g · {itemQtd.kcal}kcal
            </div>

            <div className="form-group">
              <label className="form-label">{placeholderUnidade(itemQtd.unidade)}</label>
              <input type="number" value={qtdInput} onChange={e => setQtdInput(e.target.value)} autoFocus min="0" step={itemQtd.unidade === 'g' ? '10' : '1'} />
            </div>

            {macrosPreview && parseFloat(qtdInput) > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, padding: '6px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius-xs)', fontFamily: 'var(--font-mono)' }}>
                → P:{macrosPreview.proteina}g C:{macrosPreview.carb}g G:{macrosPreview.gordura}g · {macrosPreview.kcal}kcal
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setItemQtd(null)} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarQuantidade} disabled={!qtdInput || parseFloat(qtdInput) <= 0} style={{ flex: 2 }}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 3, marginBottom: 14 }}>
        {[{ val: 'biblioteca', label: '📚 Biblioteca' }, { val: 'texto', label: '✏️ Texto livre' }].map(t => (
          <button key={t.val} onClick={() => setModo(t.val)} style={{
            flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)',
            background: modo === t.val ? 'var(--accent)' : 'transparent',
            color: modo === t.val ? '#1a1510' : 'var(--text2)',
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Texto livre */}
      {modo === 'texto' && (
        <div>
          <div className="form-group">
            <textarea placeholder="Ex: 200g de frango grelhado com brócolis e azeite..." value={texto} onChange={e => setTexto(e.target.value)} rows={3} style={{ resize: 'none' }} />
          </div>
          <button className="btn btn-primary btn-full" onClick={interpretarTexto} disabled={loadingIA || !texto.trim()}>
            {loadingIA ? '🤖 Calculando...' : '🤖 Calcular e adicionar'}
          </button>
        </div>
      )}

      {/* Biblioteca */}
      {modo === 'biblioteca' && (
        <div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
            <input placeholder="Buscar alimento..." value={busca} onChange={e => setBusca(e.target.value)} style={{ flex: 1 }} />
          </div>

          {/* Toggle mostrar todas */}
          {!busca && tipoSelecionado?.cats.length > 0 && (
            <button onClick={() => setMostrarTodas(p => !p)} style={{
              background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12,
              cursor: 'pointer', padding: '0 0 12px', fontFamily: 'var(--font-mono)',
            }}>
              {mostrarTodas ? '← Mostrar só do café da manhã' : 'Ver todos os alimentos →'}
            </button>
          )}

          {Object.entries(porCategoria).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div className="section-title">{LABEL_CATS[cat] || cat}</div>
              {items.map(item => (
                <div key={item.id} onClick={() => abrirQuantidade(item)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  marginBottom: 5, cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{item.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                      por {item.unidade === 'g' ? `${item.qtd_base}g` : labelUnidade(item.unidade, 1)}
                      {' · '}P:{item.proteina}g C:{item.carb}g G:{item.gordura}g
                    </div>
                  </div>
                  <span style={{ color: 'var(--accent)', fontSize: 18, paddingLeft: 8, fontWeight: 300 }}>+</span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setEtapa('itens')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16 }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Confirmar refeição</h2>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{tipoSelecionado?.icon} {tipoSelecionado?.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>🕐 {horario || '--:--'}</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nome personalizado (opcional)</label>
          <input placeholder={tipoSelecionado?.label} value={nomePersonalizado} onChange={e => setNomePersonalizado(e.target.value)} />
        </div>

        <div className="section-title" style={{ marginTop: 4 }}>Itens ({itens.length})</div>
        {itens.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <span>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginRight: 6, fontSize: 12 }}>{labelUnidade(item.unidade, item.quantidade)}</span>
              {item.nome}
            </span>
            <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{item.kcal}kcal</span>
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 12 }}>
          {[
            { l: 'Proteína', v: Math.round(totais.proteina), u: 'g', c: 'var(--accent)' },
            { l: 'Carbo', v: Math.round(totais.carb), u: 'g', c: 'var(--blue)' },
            { l: 'Gordura', v: Math.round(totais.gordura), u: 'g', c: 'var(--orange)' },
            { l: 'Kcal', v: Math.round(totais.kcal), u: '', c: 'var(--text2)' },
          ].map(m => (
            <div key={m.l} style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '7px 4px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: m.c }}>{m.v}{m.u}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{m.l}</div>
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
