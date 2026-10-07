import { memo, useEffect, useRef, useState } from 'react'
import { Extension } from '@tiptap/core'
import { Selection } from '@tiptap/pm/state'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import { Popover, Dialog } from 'radix-ui'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ImagePlus,
  Quote,
  Minus,
  Megaphone,
  Type,
  Undo2,
  Redo2,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { uploadCmsImage } from '../../../services/admin/mediaUpload'
import { safeArticleUrl } from '../../../pages/solutions/SolutionArticleView'
import { articleNodeExtensions } from './ArticleNodes'

const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] }
const HeadingIdentity = Extension.create({
  name: 'headingIdentity',
  addGlobalAttributes: () => [
    { types: ['heading'], attributes: { id: { default: null } } },
  ],
})
function ArticleEditorComponent({
  value,
  onChange,
  onBusyChange,
  disabled = false,
}) {
  const { csrfToken } = useAuth()
  const current = useRef({ onChange, csrfToken, onBusyChange })
  current.current = { onChange, csrfToken, onBusyChange }
  const uploadCount = useRef(0)
  const requests = useRef(new Set())
  useEffect(() => {
    const activeRequests = requests.current
    return () => {
      activeRequests.forEach((controller) => controller.abort())
      current.current.onBusyChange?.(false)
    }
  }, [])
  const menu = useRef(null)
  const fileInput = useRef(null)
  const [slash, setSlash] = useState(null)
  const [index, setIndex] = useState(0)
  const [focused, setFocused] = useState(false)
  const [uploadState, setUploadState] = useState({})
  const [linkOpen, setLinkOpen] = useState(false)
  const [link, setLink] = useState('')
  const [linkError, setLinkError] = useState('')
  const upload = async (file) => {
    const controller = new AbortController()
    requests.current.add(controller)
    uploadCount.current++
    current.current.onBusyChange?.(true)
    try {
      return await uploadCmsImage(
        file,
        current.current.csrfToken,
        controller.signal,
      )
    } finally {
      requests.current.delete(controller)
      uploadCount.current--
      current.current.onBusyChange?.(uploadCount.current > 0)
    }
  }
  const insertImage = async (file, position) => {
    if (!file || disabled) return
    setUploadState({ pending: true })
    try {
      const result = await upload(file)
      const node = {
        type: 'articleImage',
        attrs: {
          id: crypto.randomUUID(),
          src: result.secure_url,
          alt: '',
          caption: '',
          display: 'normal',
        },
      }
      const chain = editor.chain().focus()
      position === undefined
        ? chain.insertContent(node).run()
        : chain
            .insertContentAt(
              Math.min(position, editor.state.doc.content.size),
              node,
            )
            .run()
      setUploadState({ success: true })
    } catch (error) {
      setUploadState({ error: error.message })
    }
  }
  const inspectSlash = (instance) => {
    const { $from, empty } = instance.state.selection
    const before = $from.parent.textBetween(0, $from.parentOffset, '\n')
    if (!empty || $from.parent.type.name !== 'paragraph' || before !== '/') {
      setSlash(null)
      return
    }
    const coords = instance.view.coordsAtPos($from.pos)
    setSlash((previous) =>
      previous?.from === $from.pos - 1
        ? previous
        : {
            from: $from.pos - 1,
            to: $from.pos,
            left: coords.left,
            top: coords.bottom,
          },
    )
    setIndex(0)
  }
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        trailingNode: false,
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          HTMLAttributes: { class: null },
          isAllowedUri: (url) => !!safeArticleUrl(url),
        },
      }),
      HeadingIdentity,
      ...articleNodeExtensions(upload),
    ],
    content: value?.doc || emptyDoc,
    editable: !disabled,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor: instance }) => {
      // Keep identifiers stable, assigning new ones to inserted/pasted copies.
      const tr = instance.state.tr
      let changed = false
      const seen = new Set()
      instance.state.doc.descendants((node, pos) => {
        if (!['heading', 'articleImage', 'articleCta'].includes(node.type.name))
          return
        const identity =
          (node.type.name === 'heading' ? 'heading:' : 'media:') + node.attrs.id
        if (!node.attrs.id || seen.has(identity)) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id:
              (node.type.name === 'heading' ? 'section-' : '') +
              crypto.randomUUID(),
          })
          changed = true
        }
        seen.add(identity)
      })
      if (changed) {
        instance.view.dispatch(tr)
        return
      }
      current.current.onChange({ version: 1, doc: instance.getJSON() })
      inspectSlash(instance)
    },
    onSelectionUpdate: ({ editor: instance }) => inspectSlash(instance),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    editorProps: {
      attributes: {
        class: 'admin-article-document',
        'aria-label': 'Nội dung bài viết',
        'data-placeholder': 'Nhập nội dung. Gõ / để thêm nội dung.',
      },
      handleKeyDown: (_, event) => {
        if (!menu.current) return false
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
          event.preventDefault()
          menu.current(event.key)
          return true
        }
        return false
      },
      handleDrop: (view, event, _slice, moved) => {
        const file = event.dataTransfer?.files[0]
        if (!moved && file?.type.startsWith('image/')) {
          event.preventDefault()
          const pos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })?.pos
          void insertImage(file, pos)
          return true
        }
        return false
      },
      handlePaste: (_, event) => {
        const file = [...(event.clipboardData?.files || [])].find((file) =>
          file.type.startsWith('image/'),
        )
        if (file) {
          event.preventDefault()
          void insertImage(file)
          return true
        }
        return false
      },
    },
  })
  useEffect(() => {
    if (
      editor &&
      JSON.stringify(editor.getJSON()) !==
        JSON.stringify(value?.doc || emptyDoc)
    )
      editor.commands.setContent(value?.doc || emptyDoc, { emitUpdate: false })
  }, [editor, value])
  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])
  if (!editor) return null
  const options = [
    ['Đoạn văn', Type, (chain) => chain.setParagraph()],
    ['Tiêu đề H2', Heading2, (chain) => chain.setHeading({ level: 2 })],
    ['Tiêu đề H3', Heading3, (chain) => chain.setHeading({ level: 3 })],
    ['Hình ảnh', ImagePlus, null],
    ['Danh sách dấu đầu dòng', List, (chain) => chain.toggleBulletList()],
    ['Danh sách đánh số', ListOrdered, (chain) => chain.toggleOrderedList()],
    ['Trích dẫn', Quote, (chain) => chain.toggleBlockquote()],
    [
      'Lưu ý / Callout',
      Quote,
      (chain) =>
        chain.insertContent({
          type: 'callout',
          attrs: { variant: 'info' },
          content: [{ type: 'paragraph' }],
        }),
    ],
    [
      'CTA',
      Megaphone,
      (chain) =>
        chain.insertContent({
          type: 'articleCta',
          attrs: {
            id: crypto.randomUUID(),
            title: '',
            description: '',
            label: '',
            url: '',
            style: 'primary',
          },
        }),
    ],
    ['Đường phân cách', Minus, (chain) => chain.setHorizontalRule()],
  ]
  const choose = (option) => {
    const chain = editor.chain().focus()
    if (slash) chain.deleteRange({ from: slash.from, to: slash.to })
    setSlash(null)
    if (option[2]) option[2](chain).run()
    else {
      chain.run()
      fileInput.current.click()
    }
  }
  menu.current = slash
    ? (key) => {
        if (key === 'Escape') setSlash(null)
        else if (key === 'Enter') choose(options[index])
        else
          setIndex(
            (value) =>
              (value + (key === 'ArrowDown' ? 1 : -1) + options.length) %
              options.length,
          )
      }
    : null
  const block = () => {
    const selection = editor.state.selection
    const from = selection.$from.depth
      ? selection.$from.before(1)
      : selection.from
    const node = editor.state.doc.nodeAt(from)
    return node ? { from, to: from + node.nodeSize, node } : null
  }
  const changeBlock = (action) => {
    const item = block()
    if (!item) return
    const content = item.node.toJSON()
    if (action === 'duplicate') {
      const resetIds = (node) => {
        if (node.attrs?.id)
          node.attrs.id =
            node.type === 'heading'
              ? 'section-' + crypto.randomUUID()
              : crypto.randomUUID()
        node.content?.forEach(resetIds)
      }
      resetIds(content)
      editor
        .chain()
        .focus()
        .insertContentAt(item.to, content)
        .command(({ tr }) => {
          tr.setSelection(Selection.near(tr.doc.resolve(item.to), 1))
          return true
        })
        .run()
      return
    }
    if (action === 'delete') {
      editor.chain().focus().deleteRange(item).run()
      return
    }
    const siblings = []
    editor.state.doc.forEach((node, from) =>
      siblings.push({ node, from, to: from + node.nodeSize }),
    )
    const at = siblings.findIndex((sibling) => sibling.from === item.from),
      adjacent = siblings[at + (action === 'up' ? -1 : 1)]
    if (!adjacent) return
    const from = Math.min(item.from, adjacent.from),
      to = Math.max(item.to, adjacent.to)
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from, to },
        action === 'up'
          ? [content, adjacent.node.toJSON()]
          : [adjacent.node.toJSON(), content],
      )
      .command(({ tr }) => {
        const position = action === 'up' ? from : from + adjacent.node.nodeSize
        tr.setSelection(Selection.near(tr.doc.resolve(position), 1))
        return true
      })
      .run()
  }
  const buttons = [
    ['Đậm', Bold, () => editor.chain().focus().toggleBold().run()],
    ['Nghiêng', Italic, () => editor.chain().focus().toggleItalic().run()],
    [
      'Liên kết',
      LinkIcon,
      () => {
        setLink(editor.getAttributes('link').href || '')
        setLinkError('')
        setLinkOpen(true)
      },
    ],
    [
      'H2',
      Heading2,
      () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    ],
    [
      'H3',
      Heading3,
      () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    ],
    ['Danh sách', List, () => editor.chain().focus().toggleBulletList().run()],
    [
      'Danh sách số',
      ListOrdered,
      () => editor.chain().focus().toggleOrderedList().run(),
    ],
  ]
  return (
    <div className="admin-article-editor">
      <p className="admin-muted">
        Nhập trực tiếp. Gõ “/” để thêm nội dung. Chọn văn bản để định dạng.
      </p>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={(event) => {
          void insertImage(event.target.files[0])
          event.target.value = ''
        }}
      />
      <BubbleMenu
        editor={editor}
        className="admin-article-bubble"
        shouldShow={({ state }) =>
          !disabled &&
          !state.selection.empty &&
          !editor.isActive('articleImage') &&
          !editor.isActive('articleCta')
        }
      >
        {buttons.map(([label, Icon, run]) => (
          <button
            type="button"
            className="admin-icon-button"
            title={label}
            aria-label={label}
            key={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={run}
          >
            <Icon size={16} />
          </button>
        ))}
      </BubbleMenu>
      {focused && !disabled && (
        <div
          className="admin-article-block-tools"
          onMouseDown={(event) => event.preventDefault()}
        >
          {[
            ['Lên', ArrowUp, 'up'],
            ['Xuống', ArrowDown, 'down'],
            ['Nhân đôi', Copy, 'duplicate'],
            ['Xóa đoạn', Trash2, 'delete'],
          ].map(([label, Icon, action]) => (
            <button
              className="admin-icon-button"
              type="button"
              title={label}
              key={label}
              onClick={() => changeBlock(action)}
            >
              <Icon size={16} />
            </button>
          ))}
          <button
            className="admin-icon-button"
            type="button"
            title="Hoàn tác"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={16} />
          </button>
          <button
            className="admin-icon-button"
            type="button"
            title="Làm lại"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={16} />
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      <Popover.Root
        open={!!slash}
        onOpenChange={(open) => {
          if (!open) setSlash(null)
        }}
      >
        <Popover.Anchor asChild>
          <span
            style={{
              position: 'fixed',
              left: slash?.left || 0,
              top: slash?.top || 0,
            }}
          />
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            className="admin-article-command"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (editor.view.dom.contains(event.target)) event.preventDefault()
            }}
          >
            <div role="listbox" aria-label="Thêm nội dung">
              {options.map(([label, Icon], optionIndex) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={index === optionIndex}
                  key={label}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(options[optionIndex])}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <Dialog.Root open={linkOpen} onOpenChange={setLinkOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="admin-confirm-overlay" />
          <Dialog.Content className="admin-confirm-content admin-article-dialog">
            <Dialog.Title>Liên kết</Dialog.Title>
            <Dialog.Description>
              Đường dẫn nội bộ hoặc địa chỉ http/https.
            </Dialog.Description>
            <label>
              Đường dẫn
              <input
                value={link}
                onChange={(event) => setLink(event.target.value)}
              />
            </label>
            {linkError && <p role="alert">{linkError}</p>}
            <div className="admin-form-actions">
              <Dialog.Close className="admin-button admin-button--ghost">
                Hủy
              </Dialog.Close>
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={() => {
                  if (link && !safeArticleUrl(link)) {
                    setLinkError('Đường dẫn không hợp lệ.')
                    return
                  }
                  const chain = editor.chain().focus().extendMarkRange('link')
                  link
                    ? chain.setLink({ href: link }).run()
                    : chain.unsetLink().run()
                  setLinkOpen(false)
                }}
              >
                Áp dụng
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {uploadState.pending && (
        <p className="admin-semantic-status admin-semantic-status--info">
          Đang tải ảnh…
        </p>
      )}
      {uploadState.success && (
        <p className="admin-semantic-status admin-semantic-status--success">
          Đã tải ảnh
        </p>
      )}
      {uploadState.error && (
        <p className="admin-media-error" role="alert">
          {uploadState.error}
        </p>
      )}
    </div>
  )
}
export const ArticleEditor = memo(ArticleEditorComponent)
