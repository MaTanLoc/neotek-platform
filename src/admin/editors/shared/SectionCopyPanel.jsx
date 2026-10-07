export function SectionCopyPanel({
  value,
  onChange,
  names = ['eyebrow', 'title', 'titleHighlight', 'description', 'ctaLabel'],
}) {
  const fields = [
    ['eyebrow', 'Dòng giới thiệu', 'input'],
    ['title', 'Tiêu đề', 'textarea'],
    ['titleHighlight', 'Phần nhấn mạnh', 'textarea'],
    ['description', 'Mô tả', 'textarea-long'],
    ['ctaLabel', 'Nhãn hành động', 'input'],
    ['ctaUrl', 'Đích hành động', 'input'],
  ]

  return (
    <div className="admin-copy-fields">
      {fields
        .filter(([key]) => names.includes(key))
        .map(([key, label, kind]) => (
          <label key={key}>
            {label}
            {kind.startsWith('textarea') ? (
              <textarea
                rows={kind === 'textarea-long' ? 4 : 2}
                value={value?.[key] || ''}
                onChange={event =>
                  onChange({ ...value, [key]: event.target.value })
                }
              />
            ) : (
              <input
                value={value?.[key] || ''}
                onChange={event =>
                  onChange({ ...value, [key]: event.target.value })
                }
              />
            )}
          </label>
        ))}
    </div>
  )
}
