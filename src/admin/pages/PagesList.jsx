import {useCallback, useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import {useAuth} from '../auth/useAuth'
import {adminApi} from '../../services/admin/adminApi'

function formatDate(value) { return value ? new Date(value).toLocaleString('vi-VN') : '—' }

export function PagesList() {
  const { user, csrfToken, clearAuth } = useAuth()
  const [pages, setPages] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [newPage, setNewPage] = useState({ slug: '', locale: 'vi', title: '' })

  const load = useCallback(async () => {
    setState({ loading: true, error: '' })
    try { setPages(await adminApi.getPages()) }
    catch (error) { if (error.status === 401) clearAuth(); setState({ loading: false, error: 'Không tải được danh sách trang. Vui lòng thử lại.' }) }
    finally { setState(previous => ({ ...previous, loading: false })) }
  }, [clearAuth])
  useEffect(() => { load() }, [load])

  const create = async (event) => {
    event.preventDefault()
    try {
      const page = await adminApi.createPage({ slug: newPage.slug, translations: [{ locale: newPage.locale, title: newPage.title }] }, csrfToken)
      window.location.href = `/admin/pages/${page.slug}`
    } catch (error) { if (error.status === 401) clearAuth(); setState(previous => ({ ...previous, error: error.status === 409 ? 'Đường dẫn trang này đã tồn tại.' : 'Không thể tạo trang. Vui lòng kiểm tra nội dung và thử lại.' })) }
  }

  return <section>
    <div className="admin-page-heading"><div><p className="admin-kicker">Nội dung</p><h1>Trang nội dung</h1></div>
      {user?.role === 'ADMIN' && <button className="admin-button admin-button--primary" onClick={() => setShowCreate(!showCreate)}>Tạo trang</button>}
    </div>
    {state.error && <div className="admin-alert admin-alert--error" role="alert">{state.error}</div>}
    {showCreate && <form className="admin-card admin-form-grid" onSubmit={create}>
      <h2>Tạo trang</h2><label>Đường dẫn<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={newPage.slug} onChange={e => setNewPage({ ...newPage, slug: e.target.value })} /></label>
      <label>Ngôn ngữ ban đầu<input required value={newPage.locale} onChange={e => setNewPage({ ...newPage, locale: e.target.value })} /></label>
      <label>Tiêu đề<input required value={newPage.title} onChange={e => setNewPage({ ...newPage, title: e.target.value })} /></label>
      <button className="admin-button admin-button--primary">Tạo trang</button>
    </form>}
    {state.loading ? <p className="admin-muted">Đang tải danh sách trang…</p> : pages.length === 0 ? <div className="admin-card">Chưa có trang nội dung.</div> :
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Đường dẫn</th><th>Tiêu đề</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>
        {pages.map(page => <tr key={page.id}><td><Link to={page.kind === "SOLUTION_DETAIL" ? `/admin/solutions/${page.slug}` : `/admin/pages/${page.slug}`}>{page.slug}</Link></td><td>{page.translations?.map(t => `${t.locale}: ${t.title}`).join(' · ') || '—'}</td><td><span className="admin-badge">{page.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}</span></td><td>{formatDate(page.updatedAt)}</td></tr>)}
      </tbody></table></div>}
  </section>
}
