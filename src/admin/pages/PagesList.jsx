import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { adminApi } from '../../services/admin/adminApi'

function formatDate(value) { return value ? new Date(value).toLocaleString() : '—' }

export function PagesList() {
  const { user, csrfToken, clearAuth } = useAuth()
  const [pages, setPages] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [newPage, setNewPage] = useState({ slug: '', locale: 'vi', title: '' })

  const load = useCallback(async () => {
    setState({ loading: true, error: '' })
    try { setPages(await adminApi.getPages()) }
    catch (error) { if (error.status === 401) clearAuth(); setState({ loading: false, error: error.message }) }
    finally { setState(previous => ({ ...previous, loading: false })) }
  }, [clearAuth])
  useEffect(() => { load() }, [load])

  const create = async (event) => {
    event.preventDefault()
    try {
      const page = await adminApi.createPage({ slug: newPage.slug, translations: [{ locale: newPage.locale, title: newPage.title }] }, csrfToken)
      window.location.href = `/admin/pages/${page.slug}`
    } catch (error) { setState(previous => ({ ...previous, error: error.message })) }
  }

  return <section>
    <div className="admin-page-heading"><div><p className="admin-kicker">Content</p><h1>Pages</h1></div>
      {user?.role === 'ADMIN' && <button className="admin-button admin-button--primary" onClick={() => setShowCreate(!showCreate)}>Create page</button>}
    </div>
    {state.error && <div className="admin-alert admin-alert--error" role="alert">{state.error}</div>}
    {showCreate && <form className="admin-card admin-form-grid" onSubmit={create}>
      <h2>Create page</h2><label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={newPage.slug} onChange={e => setNewPage({ ...newPage, slug: e.target.value })} /></label>
      <label>Initial locale<input required value={newPage.locale} onChange={e => setNewPage({ ...newPage, locale: e.target.value })} /></label>
      <label>Title<input required value={newPage.title} onChange={e => setNewPage({ ...newPage, title: e.target.value })} /></label>
      <button className="admin-button admin-button--primary">Create</button>
    </form>}
    {state.loading ? <p className="admin-muted">Loading pages…</p> : pages.length === 0 ? <div className="admin-card">No pages found.</div> :
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Slug</th><th>Title</th><th>Status</th><th>Updated</th></tr></thead><tbody>
        {pages.map(page => <tr key={page.id}><td><Link to={`/admin/pages/${page.slug}`}>{page.slug}</Link></td><td>{page.translations?.map(t => `${t.locale}: ${t.title}`).join(' · ') || '—'}</td><td><span className="admin-badge">{page.status}</span></td><td>{formatDate(page.updatedAt)}</td></tr>)}
      </tbody></table></div>}
  </section>
}
