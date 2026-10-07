import { adminApi } from './adminApi'

export async function uploadCmsImage(file, csrfToken, signal) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) throw new Error('Chọn ảnh JPG, PNG, WebP, GIF hoặc AVIF.')
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Ảnh phải nhỏ hơn hoặc bằng 10 MB.')
  const signed = await adminApi.getUploadSignature(csrfToken, signal)
  const endpoint = new URL(signed.uploadUrl)
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'api.cloudinary.com' || !/^\/v1_1\/[^/]+\/image\/upload$/.test(endpoint.pathname)) throw new Error('Không thể xác định nơi tải ảnh.')
  const body = new FormData()
  Object.entries(signed.params).forEach(([key, value]) => body.append(key, String(value)))
  body.append('api_key', signed.apiKey)
  body.append('signature', signed.signature)
  body.append('file', file)
  const response = await fetch(signed.uploadUrl, { method: 'POST', body, signal, credentials: 'omit' })
  const result = await response.json()
  if (!response.ok) throw new Error('Tải ảnh chưa thành công. Vui lòng thử lại.')
  const url = new URL(result.secure_url)
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || typeof result.public_id !== 'string') throw new Error('Dịch vụ chưa trả về ảnh hợp lệ.')
  return { secure_url: result.secure_url, public_id: result.public_id }
}
