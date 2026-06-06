import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [aba, setAba] = useState('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, cadastrar } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      if (aba === 'login') {
        await login(email, senha)
        navigate('/')
      } else {
        await cadastrar(email, senha)
        navigate('/onboarding')
      }
    } catch (err) {
      setErro(
        err.message.includes('Invalid login') ? 'Email ou senha incorretos.' :
        err.message.includes('already registered') ? 'Este email já está cadastrado.' :
        err.message.includes('Password') ? 'A senha deve ter pelo menos 6 caracteres.' :
        'Erro ao entrar. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: 8 }}>
          LYON PROTOCOL
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.2, marginBottom: 6 }}>
          Sua dieta.<br />Sua regra.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          Nutrição baseada em ciência, personalizada para você.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 24 }}>
        {['login', 'cadastro'].map(t => (
          <button
            key={t}
            onClick={() => { setAba(t); setErro('') }}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: 'var(--radius-sm)',
              background: aba === t ? 'var(--accent)' : 'transparent',
              color: aba === t ? '#111' : 'var(--text2)',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {erro && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
            {erro}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <input
            type="password"
            placeholder={aba === 'cadastro' ? 'Mínimo 6 caracteres' : '••••••••'}
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            autoComplete={aba === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          style={{ marginTop: 8 }}
          disabled={loading}
        >
          {loading ? 'Aguarde...' : aba === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      {aba === 'cadastro' && (
        <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          Ao criar sua conta você será guiado por um onboarding para configurar sua dieta personalizada pelo Lyon Protocol.
        </p>
      )}
    </div>
  )
}
