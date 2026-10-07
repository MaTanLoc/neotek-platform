import {EditorActionBar} from './EditorPrimitives'
import {useConfirm} from '../../app/ConfirmProvider'
import {ArrowUp, ArrowDown} from 'lucide-react'
export function ItemActionRow({ index, total, onMove, onRemove }) {
  const confirm = useConfirm()
  return (
    <EditorActionBar showStatus={false} onDelete={async () => { if (await confirm('Xóa mục này? Thay đổi sẽ được áp dụng khi lưu.')) onRemove(index) }} actions={      <div className="admin-item-order-actions" aria-label="Sắp xếp mục">
        <button
          type="button"
          className="admin-icon-button"
          aria-label="Đưa mục lên"
          title="Đưa mục lên"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
        >
          <ArrowUp size={16} />
        </button>
        <button
          type="button"
          className="admin-icon-button"
          aria-label="Đưa mục xuống"
          title="Đưa mục xuống"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
        >
          <ArrowDown size={16} />
        </button>
      </div>} />
  )
}
