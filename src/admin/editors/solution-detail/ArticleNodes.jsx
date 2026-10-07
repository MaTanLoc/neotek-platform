/* eslint-disable react-refresh/only-export-components -- Tiptap node factories and their private views form one extension boundary. */
import { Node, mergeAttributes } from '@tiptap/core'
import {
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
} from '@tiptap/react'
import { Dialog, Popover } from 'radix-ui'
import { useState } from 'react'
import { ImagePlus, Trash2, Pencil, X } from 'lucide-react'

function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  extension,
  selected,
}) {
  const { src, alt, caption, display } = node.attrs
  const [state, setState] = useState({})
  const upload = async (file) => {
    if (!file) return
    setState({ pending: true })
    try {
      const result = await extension.options.upload(file)
      updateAttributes({ src: result.secure_url })
      setState({ success: true })
    } catch (error) {
      setState({ error: error.message })
    }
  }
  return (
    <NodeViewWrapper
      className={`admin-article-image${selected ? ' is-selected' : ''}`}
      data-display={display}
    >
      <figure contentEditable={false}>
        <img src={src} alt={alt} draggable="false" />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
      {selected && (
        <div className="admin-article-node-tools" contentEditable={false}>
          <label className="admin-button admin-button--secondary">
            <ImagePlus size={16} />
            Thay ảnh
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              hidden
              disabled={state.pending}
              onChange={(event) => upload(event.target.files[0])}
            />
          </label>
          <Popover.Root>
            <Popover.Trigger className="admin-button admin-button--secondary">
              Chú thích & hiển thị
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="admin-article-popover" sideOffset={8}>
                <label>
                  Mô tả ảnh
                  <input
                    value={alt}
                    onChange={(event) =>
                      updateAttributes({ alt: event.target.value })
                    }
                  />
                </label>
                <label>
                  Chú thích
                  <input
                    value={caption}
                    onChange={(event) =>
                      updateAttributes({ caption: event.target.value })
                    }
                  />
                </label>
                <label>
                  Hiển thị
                  <select
                    value={display}
                    onChange={(event) =>
                      updateAttributes({ display: event.target.value })
                    }
                  >
                    <option value="normal">Thông thường</option>
                    <option value="wide">Rộng</option>
                    <option value="full">Toàn chiều rộng bài viết</option>
                  </select>
                </label>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <button
            className="admin-icon-button"
            type="button"
            title="Xóa ảnh"
            onClick={deleteNode}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      {state.pending && (
        <p
          className="admin-semantic-status admin-semantic-status--info"
          contentEditable={false}
        >
          Đang tải ảnh…
        </p>
      )}
      {state.error && (
        <p role="alert" className="admin-media-error" contentEditable={false}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          className="admin-semantic-status admin-semantic-status--success"
          contentEditable={false}
        >
          Đã tải ảnh
        </p>
      )}
    </NodeViewWrapper>
  )
}
function CtaNodeView({ node, updateAttributes, deleteNode, selected }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(node.attrs)
  return (
    <NodeViewWrapper
      className={`admin-article-cta${selected ? ' is-selected' : ''}`}
      contentEditable={false}
    >
      <strong>{node.attrs.title || 'Lời kêu gọi hành động'}</strong>
      <p>{node.attrs.description}</p>
      <span>{node.attrs.label || 'Nút hành động'}</span>
      <Dialog.Root
        open={open}
        onOpenChange={(value) => {
          if (value) setDraft(node.attrs)
          setOpen(value)
        }}
      >
        <Dialog.Trigger className="admin-icon-button" title="Chỉnh lời kêu gọi">
          <Pencil size={16} />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="admin-confirm-overlay" />
          <Dialog.Content className="admin-confirm-content admin-article-dialog">
            <Dialog.Title>Lời kêu gọi hành động</Dialog.Title>
            <Dialog.Description>
              Nội dung theo ngôn ngữ đang chọn. Đường dẫn dùng chung cho cùng
              một lời kêu gọi.
            </Dialog.Description>
            {[
              ['title', 'Tiêu đề'],
              ['description', 'Mô tả'],
              ['label', 'Nhãn nút'],
              ['url', 'Đường dẫn'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={draft[key]}
                  onChange={(event) =>
                    setDraft({ ...draft, [key]: event.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Kiểu nút
              <select
                value={draft.style}
                onChange={(event) =>
                  setDraft({ ...draft, style: event.target.value })
                }
              >
                <option value="primary">Chính</option>
                <option value="secondary">Phụ</option>
              </select>
            </label>
            <label>
              Vị trí hiển thị
              <select
                value={draft.placement || 'inline'}
                onChange={(event) =>
                  setDraft({ ...draft, placement: event.target.value })
                }
              >
                <option value="inline">Trong bài viết</option>
                <option value="final">
                  Cuối trang, sau giải pháp liên quan
                </option>
              </select>
            </label>
            <div className="admin-form-actions">
              <Dialog.Close className="admin-button admin-button--ghost">
                Hủy
              </Dialog.Close>
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={() => {
                  updateAttributes(draft)
                  setOpen(false)
                }}
              >
                Áp dụng
              </button>
            </div>
            <Dialog.Close className="admin-icon-button" aria-label="Đóng">
              <X size={16} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {selected && (
        <button
          type="button"
          className="admin-icon-button"
          title="Xóa lời kêu gọi"
          onClick={deleteNode}
        >
          <Trash2 size={16} />
        </button>
      )}
    </NodeViewWrapper>
  )
}
function CalloutNodeView({ node, updateAttributes }) {
  return (
    <NodeViewWrapper
      className={`admin-article-callout admin-article-callout--${node.attrs.variant}`}
    >
      {
        <label contentEditable={false}>
          Loại lưu ý
          <select
            value={node.attrs.variant}
            onChange={(event) =>
              updateAttributes({ variant: event.target.value })
            }
          >
            <option value="info">Thông tin</option>
            <option value="success">Tích cực</option>
            <option value="warning">Lưu ý</option>
          </select>
        </label>
      }
      <NodeViewContent />
    </NodeViewWrapper>
  )
}
export function articleNodeExtensions(upload) {
  return [
    Node.create({
      name: 'articleImage',
      group: 'block',
      atom: true,
      draggable: true,
      addOptions: () => ({ upload }),
      addAttributes: () => ({
        id: { default: '' },
        src: { default: '' },
        alt: { default: '' },
        caption: { default: '' },
        display: { default: 'normal' },
      }),
      parseHTML: () => [{ tag: 'figure[data-article-image]' }],
      renderHTML: ({ HTMLAttributes }) => [
        'figure',
        mergeAttributes(HTMLAttributes, { 'data-article-image': '' }),
      ],
      addNodeView: () => ReactNodeViewRenderer(ImageNodeView),
    }),
    Node.create({
      name: 'articleCta',
      group: 'block',
      atom: true,
      draggable: true,
      addAttributes: () =>
        Object.fromEntries(
          Object.entries({
            id: '',
            title: '',
            description: '',
            label: '',
            url: '',
            style: 'primary',
            placement: 'inline',
          }).map(([key, value]) => [key, { default: value }]),
        ),
      parseHTML: () => [{ tag: 'aside[data-article-cta]' }],
      renderHTML: ({ HTMLAttributes }) => [
        'aside',
        mergeAttributes(HTMLAttributes, { 'data-article-cta': '' }),
      ],
      addNodeView: () => ReactNodeViewRenderer(CtaNodeView),
    }),
    Node.create({
      name: 'callout',
      group: 'block',
      content: 'block+',
      defining: true,
      addAttributes: () => ({ variant: { default: 'info' } }),
      parseHTML: () => [{ tag: 'aside[data-callout]' }],
      renderHTML: ({ HTMLAttributes }) => [
        'aside',
        mergeAttributes(HTMLAttributes, { 'data-callout': '' }),
        0,
      ],
      addNodeView: () => ReactNodeViewRenderer(CalloutNodeView),
    }),
  ]
}
