import { useEffect, useRef, useState } from 'react'
import { Dialog, DropdownMenu } from 'radix-ui'
import { CircleHelp, X } from 'lucide-react'

const tutorials = {
  overview: [
    ['.admin-sidebar', 'Điều hướng nội dung', 'Chọn Trang chủ, Giải pháp hoặc Chi tiết giải pháp trong Trang nội dung.'],
    ['.admin-main-content', 'Chọn nội dung cần quản lý', 'Mở trang hoặc danh sách Chi tiết giải pháp để chỉnh sửa bài viết và tạo bản nháp cho phân hệ chưa có bài.'],
  ],
  section: [
    ['.admin-sidebar', 'Chọn mục nội dung', 'Mỗi mục có trình chỉnh sửa riêng. Lưu thay đổi trước khi chuyển sang mục khác.'],
    ['.admin-editor-fields', 'Nội dung VI / EN', 'Chỉnh tiếng Việt và tiếng Anh trong các vùng ngôn ngữ tương ứng. Các trường dùng chung được ghi chú trong biểu mẫu.'],
    ['.admin-editor-action-bar', 'Lưu nội dung', 'Kiểm tra trạng thái chưa lưu và chọn Lưu thay đổi. Ảnh được tải lên qua các trường media hiện có.'],
  ],
  article: [
    ['.admin-sidebar', 'Điều hướng bài viết', 'Mở Chi tiết giải pháp để xem danh sách bài viết theo phân hệ.'],
    ['.admin-detail-language-tabs', 'Bài viết VI / EN', 'Chọn Tiếng Việt hoặc English để viết từng phiên bản. Nội dung của hai ngôn ngữ được giữ riêng.'],
    ['.admin-article-document', 'Vùng viết Tiptap', 'Viết trực tiếp trong bài. Dùng thanh công cụ để định dạng đoạn, tiêu đề và danh sách.'],
    ['.admin-article-document', 'Lệnh nhanh /', 'Gõ / ở đầu đoạn trống để chọn tiêu đề, hình ảnh, danh sách hoặc khối nội dung.'],
    ['.admin-article-document', 'Kéo thả hình ảnh', 'Kéo ảnh vào vùng viết để tải lên. Thêm mô tả ảnh, chú thích và chọn độ rộng phù hợp.'],
    ['.admin-detail-inspector', 'Bản nháp / Đã xuất bản', 'Mở Thông tin & cài đặt bài viết để chọn trạng thái. Bản nháp không hiển thị trên website; chọn Đã xuất bản rồi lưu khi bài đã sẵn sàng.'],
    ['.admin-detail-actions', 'Lưu bài viết', 'Lưu thay đổi lưu nội dung và cài đặt. Có thể dùng Ctrl+S. Bản xem đã lưu chỉ hiển thị nội dung đã lưu.'],
    ['.admin-detail-inspector', 'Thông tin SEO', 'Trong Inspector, nhập tiêu đề và mô tả SEO cho ngôn ngữ đang chọn. Để trống để dùng tiêu đề và mô tả bài viết.'],
  ],
}

export function CmsTutorial({ pathname, userKey = 'local' }) {
  const context = /^\/admin\/solutions\//.test(pathname) ? 'article' : /^\/admin\/pages\/[^/]+\/[^/]+/.test(pathname) ? 'section' : 'overview'
  const storageKey = `neotek:cms:tutorial:v1:${userKey}:${context}`
  const [open, setOpen] = useState(false), [step, setStep] = useState(0), [never, setNever] = useState(false), [bounds, setBounds] = useState(null)
  const steps = tutorials[context]
  const currentStep = Math.min(step, steps.length - 1)
  const instruction = steps[currentStep]
  const attempted = useRef('')
  const finish = () => {
    try { localStorage.setItem(storageKey, never ? 'suppressed' : 'seen') } catch { /* Storage may be disabled; tutorial stays optional. */ }
    setOpen(false)
  }
  useEffect(() => {
    setOpen(false); setStep(0); setNever(false)
    let seen = false
    try { seen = !!localStorage.getItem(storageKey) } catch { /* Optional local preference. */ }
    if (seen || attempted.current === storageKey) return
    const timer = setTimeout(() => {
      attempted.current = storageKey
      try { localStorage.setItem(storageKey, 'seen') } catch { /* Optional local preference. */ }
      setOpen(true)
    }, 900)
    return () => clearTimeout(timer)
  }, [storageKey])
  useEffect(() => {
    if (!open) return
    const update = () => {
      const target = document.querySelector(instruction[0])
      const rect = target?.getBoundingClientRect()
      setBounds(rect && rect.width && rect.height ? { left: Math.max(4, rect.left), top: Math.max(4, rect.top), width: Math.min(rect.width, innerWidth - Math.max(4, rect.left) - 4), height: Math.max(0, Math.min(rect.bottom, innerHeight - 4) - Math.max(4, rect.top)) } : null)
    }
    update()
    window.addEventListener('resize', update)
    document.addEventListener('scroll', update, true)
    const observer = new MutationObserver(update)
    observer.observe(document.querySelector('.admin-main-content'), { childList: true, subtree: true })
    return () => { window.removeEventListener('resize', update); document.removeEventListener('scroll', update, true); observer.disconnect() }
  }, [open, instruction])
  return <>
    <DropdownMenu.Root><DropdownMenu.Trigger className="admin-icon-button" aria-label="Trợ giúp CMS"><CircleHelp size={18} /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="admin-select-content" sideOffset={8}><DropdownMenu.Item className="admin-select-item" onSelect={() => { setStep(0); setNever(false); setOpen(true) }}>Xem lại hướng dẫn</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
    <Dialog.Root modal={false} open={open} onOpenChange={value => { if (!value) finish() }}><Dialog.Portal>
      {bounds && bounds.height > 0 && <div aria-hidden="true" className="admin-tutorial-spotlight" style={bounds} />}
      <Dialog.Content className="admin-tutorial-panel" onInteractOutside={event => event.preventDefault()} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}>
        <button type="button" className="admin-icon-button admin-tutorial-close" aria-label="Đóng hướng dẫn" onClick={finish}><X size={16} /></button>
        <small>Hướng dẫn · {currentStep + 1}/{steps.length}</small><Dialog.Title>{instruction[1]}</Dialog.Title><Dialog.Description>{instruction[2]}</Dialog.Description>
        <label className="admin-checkbox"><input type="checkbox" checked={never} onChange={event => setNever(event.target.checked)} />Không hiển thị lại</label>
        <div className="admin-item-controls"><button className="admin-button admin-button--ghost" onClick={finish}>Bỏ qua hướng dẫn</button>{currentStep > 0 && <button className="admin-button admin-button--secondary" onClick={() => setStep(currentStep - 1)}>Quay lại</button>}<button className="admin-button admin-button--primary" onClick={() => currentStep === steps.length - 1 ? finish() : setStep(currentStep + 1)}>{currentStep === steps.length - 1 ? 'Hoàn tất' : 'Tiếp tục'}</button></div>
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>
  </>
}
