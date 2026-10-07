import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../../../services/admin/adminApi'
import { useAuth } from '../../auth/useAuth'
import { useCms } from '../../app/cmsContext'
import { SemanticStatus } from '../shared/EditorPrimitives'

export function ModuleDetailPanel({ moduleKey, slug, disabled }) {
  const { csrfToken, clearAuth } = useAuth(),
    { dirty } = useCms(),
    navigate = useNavigate()
  const [state, setState] = useState({ loading: true })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setState({ loading: true })
    adminApi
      .listSolutionDetails()
      .then((details) => {
        if (active)
          setState({ detail: details.find((item) => item.slug === slug) })
      })
      .catch((error) => {
        if (active) {
          if (error.status === 401) clearAuth()
          setState({
            error: 'Không thể kiểm tra trang chi tiết. Vui lòng thử lại.',
          })
        }
      })
    return () => {
      active = false
    }
  }, [slug, clearAuth, retry])
  const create = async () => {
    if (dirty.current) {
      setState({ error: 'Lưu phân hệ trước khi tạo trang chi tiết.' })
      return
    }
    setState({ pending: true })
    try {
      const page = await adminApi.createSolutionDetail(moduleKey, csrfToken)
      navigate(`/admin/solutions/${page.slug}`)
    } catch (error) {
      if (error.status === 401) clearAuth()
      setState({
        error:
          error.status === 409
            ? 'Trang đã tồn tại. Mở lại phân hệ để cập nhật.'
            : 'Không thể tạo trang. Kiểm tra đường dẫn đã lưu của phân hệ và thử lại.',
      })
    }
  }
  return (
    <section className="admin-editor-section">
      <h3>Trang chi tiết</h3>
      {state.error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {state.error}
          <button type="button" className="admin-button admin-button--ghost" onClick={() => setRetry(value => value + 1)}>Thử lại</button>
        </p>
      )}
      {state.loading ? (
        <p>Đang kiểm tra…</p>
      ) : state.detail ? (
        <div className="admin-item-controls">
          <SemanticStatus dirty={state.detail.status !== 'PUBLISHED'}>
            {state.detail.status === 'PUBLISHED'
              ? 'Đã xuất bản'
              : state.detail.status === 'ARCHIVED'
                ? 'Đã lưu trữ'
                : 'Bản nháp'}
          </SemanticStatus>
          <Link
            className="admin-button admin-button--secondary"
            to={`/admin/solutions/${state.detail.slug}`}
          >
            Chỉnh trang chi tiết
          </Link>
        </div>
      ) : (
        <>
          <span className="admin-semantic-status admin-semantic-status--info">
            {state.error ? 'Chưa kiểm tra' : 'Chưa có'}
          </span>
          <button
            type="button"
            className="admin-button admin-button--secondary"
            disabled={
              disabled || state.pending || !slug || dirty.current || state.error
            }
            onClick={create}
          >
            {state.pending ? 'Đang tạo…' : 'Tạo trang chi tiết'}
          </button>
          {(!slug || dirty.current) && (
            <small>
              Lưu phân hệ với đường dẫn dùng chung cho VI/EN trước khi tạo trang
              chi tiết.
            </small>
          )}
        </>
      )}
    </section>
  )
}
