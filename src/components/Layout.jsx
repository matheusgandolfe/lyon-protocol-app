import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

const TABS = [
  { path: '/', icon: '◎', label: 'Hoje' },
  { path: '/registro', icon: '＋', label: 'Registrar' },
  { path: '/biblioteca', icon: '▤', label: 'Biblioteca' },
  { path: '/perfil', icon: '◑', label: 'Perfil' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { perfil } = useAuth()

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>LYON</div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>{perfil?.nome?.split(' ')[0] || 'Você'}</span>
        </div>
      </header>

      <main className={styles.main}>
        {children}
      </main>

      <nav className={styles.nav}>
        {TABS.map(tab => (
          <button
            key={tab.path}
            className={`${styles.navBtn} ${location.pathname === tab.path ? styles.active : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className={styles.navIcon}>{tab.icon}</span>
            <span className={styles.navLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
