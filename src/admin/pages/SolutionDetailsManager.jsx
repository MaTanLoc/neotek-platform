import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { SolutionDetailsContext, detailStatus } from '../utils/solutionDetails'
import { adminApi } from '../../services/admin/adminApi'
import { useAuth } from '../auth/useAuth'

export function SolutionDetailsManager() {
  const { entries, loading, error } = useContext(SolutionDetailsContext)
  const { csrfToken, clearAuth } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState(''), [filter, setFilter] = useState(''), [creating, setCreating] = useState(false), [selected, setSelected] = useState(''), [pending, setPending] = useState(false), [message, setMessage] = useState('')
  const missing = entries.filter(entry => !entry.page)
  const selectedEntry = missing.find(entry => entry.key === selected)
  const create = async event => {
    event.preventDefault()
    if (!selectedEntry?.readyToCreate || pending) return
    setPending(true); setMessage('')
    try {
      const page = await adminApi.createSolutionDetail(selected, csrfToken)
      navigate(`/admin/solutions/${page.slug}`)
    } catch (error) {
      if (error.status === 401) clearAuth()
      setMessage(error.status === 409 ? 'Bài viết đã tồn tại. Tải lại danh sách để mở bài viết.' : 'Không thể tạo bài viết. Kiểm tra đường dẫn phân hệ đã lưu và thử lại.')
    } finally { setPending(false) }
  }
  return <section className="admin-detail-manager">
    <div className="admin-page-heading"><div><h1>Chi tiết giải pháp</h1><p className="admin-muted">Quản lý nội dung chuyên sâu cho từng phân hệ</p></div><button className="admin-button admin-button--primary" disabled={loading || !!error || !missing.length} onClick={() => { setCreating(!creating); setSelected(missing[0]?.key || '') }}><Plus size={16} />Tạo bài viết</button></div>
    {(error || message) && <p className="admin-alert admin-alert--error" role="alert">{error || message}</p>}
    {creating && <form className="admin-card admin-editor-block" onSubmit={create}><label>Phân hệ chưa có bài viết<select value={selected} disabled={pending} onChange={event => setSelected(event.target.value)}>{missing.map(entry => <option key={entry.key} value={entry.key}>{entry.module}</option>)}</select></label>{selectedEntry && !selectedEntry.readyToCreate && <p className="admin-muted">Phân hệ cần đường dẫn đã lưu giống nhau ở VI / EN trước khi tạo bài viết. <Link to="/admin/pages/solutions/modules">Thiết lập đường dẫn phân hệ</Link></p>}<button className="admin-button admin-button--primary" disabled={pending || !selectedEntry?.readyToCreate}>{pending ? 'Đang tạo…' : 'Tạo bản nháp'}</button></form>}
    <div className="admin-detail-filters"><label>Tìm bài viết<input type="search" value={search} onChange={event => setSearch(event.target.value)} /></label><label>Trạng thái<select value={filter} onChange={event => setFilter(event.target.value)}><option value="">Tất cả</option>{['Đã xuất bản', 'Bản nháp', 'Chưa có', 'Đã lưu trữ'].map(status => <option key={status}>{status}</option>)}</select></label></div>
    {loading ? <p aria-busy="true">Đang tải bài viết…</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tên</th><th>Phân hệ</th><th>Trạng thái</th><th>Cập nhật gần nhất</th></tr></thead><tbody>{entries.filter(entry => (!filter || detailStatus(entry.page) === filter) && `${entry.title} ${entry.module}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))).map(entry => <tr key={entry.key} className={entry.page ? "is-editable" : undefined} onClick={event => { if (entry.page && !event.target.closest("a, button")) navigate(`/admin/solutions/${entry.slug}`) }}><td>{entry.page ? <Link className="admin-detail-row-link" to={`/admin/solutions/${entry.slug}`}>{entry.title}</Link> : <button className="admin-button admin-button--ghost" disabled={pending} onClick={() => { setSelected(entry.key); setCreating(true) }}>{entry.title}</button>}</td><td>{entry.module}</td><td><span className={`admin-semantic-status admin-semantic-status--${entry.page?.status === 'PUBLISHED' ? 'success' : entry.page ? 'warning' : 'info'}`}>{detailStatus(entry.page)}</span></td><td>{entry.page?.updatedAt ? new Date(entry.page.updatedAt).toLocaleString('vi-VN') : '—'}</td></tr>)}</tbody></table>{!entries.length && !error && <p className="admin-muted">Chưa có phân hệ hoặc bài viết.</p>}</div>}
  </section>
}
