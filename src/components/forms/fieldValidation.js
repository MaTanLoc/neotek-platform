import { z } from 'zod'

export function fieldValidators(language) {
  const en = language === 'en'
  const required = en ? 'This field is required.' : 'Vui lòng nhập thông tin này.'
  const text = (value, max) => !value?.trim() ? required : value.trim().length > max || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ? (en ? 'Enter a valid value.' : 'Vui lòng nhập thông tin hợp lệ.') : ''
  const password = value => !value ? required : value.length < 12 || value.length > 256 ? (en ? 'Use 12–256 characters.' : 'Mật khẩu cần có 12–256 ký tự.') : ''
  return {
    required: value => value ? '' : required,
    text,
    email: value => !value?.trim() ? required : !z.string().trim().max(254).email().safeParse(value).success ? (en ? 'Enter a valid email address.' : 'Vui lòng nhập địa chỉ email hợp lệ.') : '',
    password,
    confirm: (value, original) => password(value) || (value !== original ? (en ? 'Passwords do not match.' : 'Mật khẩu xác nhận không khớp.') : ''),
    phone: value => text(value, 32) || (!/^\+?[0-9 () .-]+$/.test(value.trim()) || value.replace(/\D/g, '').length < 7 ? (en ? 'Enter a valid phone number.' : 'Vui lòng nhập số điện thoại hợp lệ.') : ''),
    message: value => (value?.length || 0) > 2000 ? (en ? 'Use at most 2000 characters.' : 'Vui lòng nhập tối đa 2000 ký tự.') : '',
  }
}
