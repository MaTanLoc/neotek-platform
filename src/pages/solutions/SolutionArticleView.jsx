import { isPublicHrefEnabled } from '../../config/features'
/* eslint-disable react-refresh/only-export-components -- Keep the small renderer helpers beside their single rendering contract. */
import { Fragment } from 'react'
import { getLocalizedPath } from '../../i18n'
import { NeotekButton } from '../../components/common/NeotekButton/NeotekButton'

export const articleText = (node) =>
  [node?.text || '', ...(node?.content || []).map(articleText)].join(' ').trim()
export function articleHeadings(doc) {
  const nodes = []
  const visit = (node) => {
    if (node.type === 'heading' && node.attrs.level === 2) nodes.push(node)
    node.content?.forEach(visit)
  }
  if (doc) visit(doc)
  const used = new Set(nodes.map((node) => node.attrs.id).filter(Boolean))
  return nodes.map((node) => {
      const title = articleText(node)
      const base =
        title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replaceAll('đ', 'd')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'section'
      let id = node.attrs.id
      if (!id) {
        id = base
        let count = 1
        while (used.has(id)) id = `${base}-${++count}`
        used.add(id)
      }
      return {
        node,
        title,
        id,
      }
    })
}
export function safeArticleUrl(value, image = false) {
  // eslint-disable-next-line no-control-regex -- Reject control characters in persisted URLs.
  if (typeof value !== 'string' || /[\s\\\u0000-\u001f\u007f]/.test(value))
    return undefined
  if (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    (!image || (value.startsWith('/assets/') && !value.includes('..')))
  )
    return value
  try {
    const url = new URL(value)
    return !url.username &&
      !url.password &&
      (image
        ? url.protocol === 'https:' && url.hostname === 'res.cloudinary.com'
        : ['https:', 'http:'].includes(url.protocol))
      ? value
      : undefined
  } catch {
    return undefined
  }
}
export function SolutionArticleView({ doc, language = 'vi' }) {
  const headings = articleHeadings(doc)
  const href = (value) => {
    const safe = isPublicHrefEnabled(value) ? safeArticleUrl(value) : undefined
    return safe?.startsWith('/') ? getLocalizedPath(safe, language) : safe
  }
  function render(node, key) {
    const children = (node.content || []).map((child, index) =>
      render(child, index),
    )
    if (node.type === 'text')
      return (node.marks || []).reduce(
        (text, mark) =>
          mark.type === 'bold' ? (
            <strong key={key}>{text}</strong>
          ) : mark.type === 'italic' ? (
            <em key={key}>{text}</em>
          ) : mark.type === 'link' && href(mark.attrs.href) ? (
            <a key={key} href={href(mark.attrs.href)} rel="noopener noreferrer">
              {text}
            </a>
          ) : (
            text
          ),
        <Fragment key={key}>{node.text}</Fragment>,
      )
    const attrs = node.attrs || {}
    switch (node.type) {
      case 'paragraph':
        return <p key={key}>{children}</p>
      case 'heading':
        return attrs.level === 2 ? (
          <h2 key={key} id={headings.find((item) => item.node === node)?.id}>
            {children}
          </h2>
        ) : (
          <h3 key={key}>{children}</h3>
        )
      case 'bulletList':
        return <ul key={key}>{children}</ul>
      case 'orderedList':
        return (
          <ol key={key} start={attrs.start || 1}>
            {children}
          </ol>
        )
      case 'listItem':
        return <li key={key}>{children}</li>
      case 'blockquote':
        return <blockquote key={key}>{children}</blockquote>
      case 'hardBreak':
        return <br key={key} />
      case 'horizontalRule':
        return <hr key={key} />
      case 'callout':
        return (
          <aside
            key={key}
            className={`solution-article-callout solution-article-callout--${['info', 'success', 'warning'].includes(attrs.variant) ? attrs.variant : 'info'}`}
          >
            {children}
          </aside>
        )
      case 'articleImage':
        return safeArticleUrl(attrs.src, true) ? (
          <figure
            key={key}
            className={`solution-article-image solution-article-image--${['normal', 'wide', 'full'].includes(attrs.display) ? attrs.display : 'normal'}`}
          >
            <img
              src={attrs.src}
              alt={attrs.alt || ''}
              loading="lazy"
              decoding="async"
            />
            {attrs.caption && <figcaption>{attrs.caption}</figcaption>}
          </figure>
        ) : null
      case 'articleCta':
        return (
          <aside key={key} className="solution-article-cta">
            <h3>{attrs.title}</h3>
            <p>{attrs.description}</p>
            {href(attrs.url) && attrs.label && (
              <NeotekButton
                href={href(attrs.url)}
                variant={attrs.style === 'secondary' ? 'secondary' : 'primary'}
              >
                {attrs.label}
              </NeotekButton>
            )}
          </aside>
        )
      default:
        return null
    }
  }
  return (
    <div className="solution-article">{(doc?.content || []).map(render)}</div>
  )
}
