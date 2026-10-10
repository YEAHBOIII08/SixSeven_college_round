import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [runs, setRuns] = useState([])
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  // Check backend health on initial load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`)
        return res.json()
      })
      .then((data) => setHealthStatus(data))
      .catch((err) => {
        setHealthStatus({ status: 'error', message: err.message })
      })

    fetch('/api/runs')
      .then((res) => res.json())
      .then((data) => setRuns(data))
      .catch(() => {})

    fetch('/api/findings')
      .then((res) => res.json())
      .then((data) => setFindings(data))
      .catch(() => {})
  }, [])

  const handleCreateRun = async () => {
    setLoading(true)
    setActionMessage('')
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_name: 'HackathonTargetBot',
          attack_types: ['prompt_injection', 'tool_misuse'],
        }),
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      setActionMessage(`Created Run ID: ${data.run_id} (Status: ${data.status})`)
      // Refresh runs list
      const updatedRuns = await fetch('/api/runs').then((r) => r.json())
      setRuns(updatedRuns)
    } catch (err) {
      setActionMessage(`Error creating run: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">AgentBreak</h1>
        <p className="subtitle">
          AI Agent Security Testing Platform &mdash; Prototype Scaffolding
        </p>
      </header>

      <div className="grid">
        <section className="card">
          <h2>Backend Health Status</h2>
          <div className="meta-item">
            <span className="meta-label">Status:</span>
            {healthStatus ? (
              <span className={`status-badge ${healthStatus.status}`}>
                {healthStatus.status}
              </span>
            ) : (
              <span>Checking backend...</span>
            )}
          </div>
          {healthStatus && (
            <>
              <div className="meta-item">
                <span className="meta-label">Version:</span>
                <span>{healthStatus.version || 'N/A'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Message:</span>
                <span>{healthStatus.message}</span>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <h2>Run Security Evaluation</h2>
          <p style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            Dispatch a test run placeholder to the AgentBreak API.
          </p>
          <button className="btn" onClick={handleCreateRun} disabled={loading}>
            {loading ? 'Submitting...' : 'Register Test Run'}
          </button>
          {actionMessage && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#38bdf8' }}>
              {actionMessage}
            </p>
          )}
        </section>
      </div>

      <section className="card">
        <h2>Active Security Runs ({runs.length})</h2>
        {runs.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No test runs registered yet. Click &quot;Register Test Run&quot; above to create one.</p>
        ) : (
          <ul>
            {runs.map((r) => (
              <li key={r.run_id} style={{ marginBottom: '0.5rem', color: '#cbd5e1' }}>
                <strong>{r.run_id}</strong> &mdash; Target: {r.target_name} [{r.status}]
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Security Findings ({findings.length})</h2>
        {findings.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No findings reported. (Evaluator integration pending)</p>
        ) : (
          <ul>
            {findings.map((f) => (
              <li key={f.finding_id}>
                [{f.severity}] {f.rule_id} &mdash; {f.description}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default App
