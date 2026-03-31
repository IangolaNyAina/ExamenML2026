/**
 * App.tsx — Interface Morpion IA (Hackathon ISPM)
 * Trois modes :
 *   - vs Human  : deux joueurs humains
 *   - vs IA (ML) : IA pure via /best_move
 *   - vs IA (Hybride) : Minimax + ML via /best_move_hybrid
 */

import { useState, useEffect, useCallback } from 'react'
import { checkHealth, getBestMoveML, getBestMoveHybrid } from './api'
import './App.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Cell = 1 | -1 | 0          // 1=X  -1=O  0=vide
type GameMode = 'human' | 'ml' | 'hybrid'
type GameStatus = 'playing' | 'x_wins' | 'o_wins' | 'draw'

interface BackendStatus {
  ok: boolean
  xwins: boolean
  draw: boolean
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

const EMPTY_BOARD: Cell[] = [0, 0, 0, 0, 0, 0, 0, 0, 0]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkWin(board: Cell[], player: Cell): number[] | null {
  for (const line of WIN_LINES) {
    if (line.every(i => board[i] === player)) return line
  }
  return null
}

function getStatus(board: Cell[]): { status: GameStatus; winLine: number[] | null } {
  const xLine = checkWin(board, 1)
  if (xLine) return { status: 'x_wins', winLine: xLine }
  const oLine = checkWin(board, -1)
  if (oLine) return { status: 'o_wins', winLine: oLine }
  if (!board.includes(0)) return { status: 'draw', winLine: null }
  return { status: 'playing', winLine: null }
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function App() {
  const [board, setBoard] = useState<Cell[]>([...EMPTY_BOARD])
  const [turn, setTurn] = useState<Cell>(1)          // 1=X commence
  const [mode, setMode] = useState<GameMode>('human')
  const [thinking, setThinking] = useState(false)
  const [winLine, setWinLine] = useState<number[] | null>(null)
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing')
  const [backend, setBackend] = useState<BackendStatus>({ ok: false, xwins: false, draw: false })
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 })
  const [lastAiScore, setLastAiScore] = useState<number | null>(null)
  const [animCell, setAnimCell] = useState<number | null>(null)

  // ── Vérification connexion backend au montage ──────────────────────────────
  useEffect(() => {
    checkHealth()
      .then(h => setBackend({ ok: h.status === 'ok', xwins: h.model_xwins_loaded, draw: h.model_draw_loaded }))
      .catch(() => setBackend({ ok: false, xwins: false, draw: false }))
  }, [])

  // ── Déclenchement du coup IA ───────────────────────────────────────────────
  const makeAiMove = useCallback(async (currentBoard: Cell[], currentTurn: Cell) => {
    setThinking(true)
    setLastAiScore(null)
    try {
      // L'IA joue toujours O (-1)
      const resp = mode === 'hybrid'
        ? await getBestMoveHybrid(currentBoard, currentTurn)
        : await getBestMoveML(currentBoard, currentTurn)

      if (resp.status === 'terminal' || resp.move === -1) {
        setThinking(false)
        return
      }

      const idx = resp.move
      setLastAiScore(resp.score)

      // Petit délai visuel pour simuler la "réflexion"
      await new Promise(r => setTimeout(r, 400))

      setAnimCell(idx)
      const next = [...currentBoard] as Cell[]
      next[idx] = currentTurn
      setBoard(next)

      const { status, winLine: wl } = getStatus(next)
      setWinLine(wl)
      setGameStatus(status)

      if (status !== 'playing') {
        updateScore(status)
      } else {
        setTurn(currentTurn === 1 ? -1 : 1)
      }
    } catch (err) {
      console.error('Erreur backend IA:', err)
    } finally {
      setThinking(false)
    }
  }, [mode])

  // ── Après chaque changement de tour, vérifier si c'est l'IA ───────────────
  useEffect(() => {
    if (gameStatus !== 'playing') return
    // En mode ML ou Hybride : l'IA joue O (-1)
    if ((mode === 'ml' || mode === 'hybrid') && turn === -1) {
      makeAiMove(board, turn)
    }
  }, [turn, mode, gameStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clic humain sur une case ───────────────────────────────────────────────
  function handleCellClick(idx: number) {
    if (board[idx] !== 0) return
    if (gameStatus !== 'playing') return
    if (thinking) return
    // En mode IA, le humain joue uniquement X (turn === 1)
    if ((mode === 'ml' || mode === 'hybrid') && turn !== 1) return

    setAnimCell(idx)
    const next = [...board] as Cell[]
    next[idx] = turn
    setBoard(next)

    const { status, winLine: wl } = getStatus(next)
    setWinLine(wl)
    setGameStatus(status)

    if (status !== 'playing') {
      updateScore(status)
    } else {
      setTurn(turn === 1 ? -1 : 1)
    }
  }

  function updateScore(status: GameStatus) {
    setScore(prev => ({
      X: prev.X + (status === 'x_wins' ? 1 : 0),
      O: prev.O + (status === 'o_wins' ? 1 : 0),
      draw: prev.draw + (status === 'draw' ? 1 : 0),
    }))
  }

  // ── Réinitialisation ───────────────────────────────────────────────────────
  function resetGame() {
    setBoard([...EMPTY_BOARD])
    setTurn(1)
    setGameStatus('playing')
    setWinLine(null)
    setThinking(false)
    setLastAiScore(null)
    setAnimCell(null)
  }

  function changeMode(newMode: GameMode) {
    setMode(newMode)
    setScore({ X: 0, O: 0, draw: 0 })
    resetGame()
  }

  // ── Texte de statut ────────────────────────────────────────────────────────
  function statusText(): string {
    if (thinking) return '🤖 IA réfléchit…'
    if (gameStatus === 'x_wins') return '🎉 X a gagné !'
    if (gameStatus === 'o_wins') return mode === 'human' ? '🎉 O a gagné !' : '🤖 IA (O) a gagné !'
    if (gameStatus === 'draw') return '🤝 Match nul !'
    if (mode !== 'human' && turn === -1) return '⏳ Tour de l\'IA (O)…'
    return `Tour de ${turn === 1 ? 'X' : 'O'}`
  }

  // ── Rendu d'une case ───────────────────────────────────────────────────────
  function renderCell(idx: number) {
    const val = board[idx]
    const isWin = winLine?.includes(idx)
    const justPlayed = animCell === idx

    return (
      <button
        key={idx}
        id={`cell-${idx}`}
        className={[
          'cell',
          val === 1 ? 'cell-x' : val === -1 ? 'cell-o' : 'cell-empty',
          isWin ? 'cell-win' : '',
          justPlayed ? 'cell-anim' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => handleCellClick(idx)}
        disabled={val !== 0 || gameStatus !== 'playing' || thinking || ((mode === 'ml' || mode === 'hybrid') && turn === -1)}
        aria-label={`Case ${idx}, ${val === 1 ? 'X' : val === -1 ? 'O' : 'vide'}`}
      >
        {val === 1 && <span className="mark mark-x">✕</span>}
        {val === -1 && <span className="mark mark-o">○</span>}
      </button>
    )
  }

  // ── Libellé du mode ────────────────────────────────────────────────────────
  const modeLabels: Record<GameMode, string> = {
    human: '👥 Humain vs Humain',
    ml: '🤖 Humain vs IA (ML)',
    hybrid: '⚡ Humain vs IA (Hybride)',
  }

  const modeDescriptions: Record<GameMode, string> = {
    human: 'Deux joueurs humains s\'affrontent en local.',
    ml: 'L\'IA évalue chaque coup via les modèles ML (Random Forest + Gradient Boosting).',
    hybrid: 'Minimax-AlphaBeta (profondeur 3) guidé par les modèles ML en évaluation des feuilles.',
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-group">
            <span className="logo-icon">⊠</span>
            <div>
              <h1 className="logo-title">MorpionIA</h1>
              <p className="logo-sub">ISPM Hackathon · Machine Learning</p>
            </div>
          </div>
          <div className={`backend-badge ${backend.ok ? 'badge-ok' : 'badge-err'}`}>
            <span className="badge-dot" />
            {backend.ok
              ? `Backend connecté · ML x_wins ${backend.xwins ? '✓' : '✗'} · draw ${backend.draw ? '✓' : '✗'}`
              : 'Backend déconnecté — démarrez Flask (port 5000)'}
          </div>
        </div>
      </header>

      <main className="main">
        {/* ── Sélecteur de mode ── */}
        <section className="mode-section" aria-label="Sélection du mode de jeu">
          <div className="mode-tabs">
            {(['human', 'ml', 'hybrid'] as GameMode[]).map(m => (
              <button
                key={m}
                id={`mode-btn-${m}`}
                className={`mode-tab ${mode === m ? 'mode-tab-active' : ''}`}
                onClick={() => changeMode(m)}
              >
                {modeLabels[m]}
              </button>
            ))}
          </div>
          <p className="mode-desc">{modeDescriptions[mode]}</p>
        </section>

        {/* ── Zone de jeu ── */}
        <div className="game-area">
          {/* Scores */}
          <div className="scoreboard">
            <div className={`score-card score-x ${turn === 1 && gameStatus === 'playing' ? 'score-active' : ''}`}>
              <span className="score-label">X{mode !== 'human' ? ' (Vous)' : ''}</span>
              <span className="score-value">{score.X}</span>
            </div>
            <div className="score-card score-draw">
              <span className="score-label">Nul</span>
              <span className="score-value">{score.draw}</span>
            </div>
            <div className={`score-card score-o ${turn === -1 && gameStatus === 'playing' ? 'score-active' : ''}`}>
              <span className="score-label">O{mode !== 'human' ? ' (IA)' : ''}</span>
              <span className="score-value">{score.O}</span>
            </div>
          </div>

          {/* Status bar */}
          <div className={`status-bar ${thinking ? 'status-thinking' : ''} ${gameStatus !== 'playing' ? 'status-end' : ''}`}>
            <span>{statusText()}</span>
            {lastAiScore !== null && gameStatus === 'playing' && (
              <span className="ai-score">Score IA : {lastAiScore.toFixed(3)}</span>
            )}
          </div>

          {/* Plateau */}
          <div className={`board ${thinking ? 'board-disabled' : ''}`} role="grid" aria-label="Plateau de jeu">
            {board.map((_, idx) => renderCell(idx))}
          </div>

          {/* Boutons actions */}
          <div className="actions">
            <button id="btn-reset" className="btn btn-primary" onClick={resetGame}>
              🔄 Nouvelle partie
            </button>
            <button
              id="btn-check-backend"
              className="btn btn-secondary"
              onClick={() =>
                checkHealth()
                  .then(h => setBackend({ ok: h.status === 'ok', xwins: h.model_xwins_loaded, draw: h.model_draw_loaded }))
                  .catch(() => setBackend({ ok: false, xwins: false, draw: false }))
              }
            >
              🔧 Tester backend
            </button>
          </div>
        </div>

        {/* ── Légende ── */}
        <section className="legend-section">
          <h2 className="legend-title">Comment fonctionne l'IA ?</h2>
          <div className="legend-grid">
            <div className="legend-card">
              <div className="legend-icon">🤖</div>
              <h3>Mode ML pur</h3>
              <p>Pour chaque coup légal, l'IA appelle le modèle ML (<code>/best_move</code>) et choisit le coup maximisant <code>P(X gagne) + 0.3×P(nul)</code>.</p>
            </div>
            <div className="legend-card">
              <div className="legend-icon">⚡</div>
              <h3>Mode Hybride</h3>
              <p>Minimax-AlphaBeta jusqu'à profondeur 3, puis les modèles ML remplacent la fonction heuristique aux feuilles (<code>/best_move_hybrid</code>).</p>
            </div>
            <div className="legend-card">
              <div className="legend-icon">👥</div>
              <h3>Mode Humain</h3>
              <p>Deux joueurs s'affrontent localement. Aucun appel backend n'est effectué — jeu purement en local.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a href="https://www.ispm-edu.com" target="_blank" rel="noopener noreferrer">
          🎓 ISPM — Institut Supérieur Polytechnique de Madagascar
        </a>
        <span> · Hackathon Machine Learning · Morpion &amp; IA</span>
      </footer>
    </div>
  )
}
