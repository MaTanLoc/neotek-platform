import { useId, useRef, useState } from 'react'

export function useInlineValidation(validateValues) {
  const id = useId(), touched = useRef({})
  const [errors, setErrors] = useState({})
  const read = (form, extra) => validateValues({ ...Object.fromEntries(new FormData(form)), ...extra })
  const revalidate = (form, extra) => {
    if (!form) return
    const next = read(form, extra)
    setErrors(Object.fromEntries(Object.entries(next).filter(([name, error]) => touched.current[name] && error)))
  }
  const touch = (name, form) => {
    if (!name || !form) return
    touched.current[name] = true
    revalidate(form)
  }
  return {
    errors,
    errorId: name => `${id}-${name}-error`,
    field: name => ({ 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined }),
    events: {
      onBlur: event => touch(event.target.name, event.currentTarget),
      onChange: event => revalidate(event.currentTarget),
    },
    touch, revalidate,
    reset: () => { touched.current = {}; setErrors({}) },
    validate: form => {
      const result = read(form)
      touched.current = Object.fromEntries(Object.keys(result).map(name => [name, true]))
      const next = Object.fromEntries(Object.entries(result).filter(([, error]) => error))
      setErrors(next)
      if (!Object.keys(next).length) return true
      const first = [...form.querySelectorAll('[name], [data-validation-field]')].find(field =>
        next[field.dataset.validationField || field.name] && !field.disabled && field.type !== 'hidden' && field.getAttribute('aria-hidden') !== 'true')
      first?.focus()
      return false
    },
  }
}
