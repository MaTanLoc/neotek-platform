import {House, Layers} from 'lucide-react'

export const SECTION_METADATA = {
  hero: { label: 'Banner đầu trang', description: 'Quản lý từng slide, tiêu đề, hình ảnh và nút hành động.' },
  why: { label: 'Vì sao chọn Neotek', description: 'Các lợi ích và lý do lựa chọn nền tảng.' },
  solutionOverview: { label: 'Tổng quan giải pháp', description: 'Thông tin tổng quan về nền tảng.' },
  proofMetrics: { label: 'Số liệu nổi bật', description: 'Số liệu và kết quả kinh doanh đã được xác minh.' },
  trustedLogos: { label: 'Logo khách hàng', description: 'Logo khách hàng và đối tác.' },
  solutionClusters: { label: 'Nhóm giải pháp', description: 'Các nhóm giải pháp liên quan trên trang chủ.' },
  testimonials: { label: 'Đánh giá khách hàng', description: 'Lời nhận xét và thông tin người đánh giá.' },
  cta: { label: 'Lời kêu gọi hành động', description: 'Thông điệp và các nút liên hệ cuối trang.' },
  faq: { label: 'Câu hỏi thường gặp', description: 'Chọn từng câu hỏi để chỉnh sửa câu trả lời.' },
  solutionGroups: { label: 'Nhóm giải pháp', description: 'Nội dung nhóm giải pháp và các phân hệ liên kết.' },
  solutionModules: { label: 'Phân hệ giải pháp', description: 'Thông tin, tính năng và hình minh họa cho từng phân hệ.' },
}
export function getSectionMetadata(type, sectionKey) {
  if (sectionKey === 'footerCta') return { label: 'Lời kêu gọi ở chân trang', description: 'Nội dung và nút hành động trong khối chân trang.' }
  return SECTION_METADATA[type] || { label: type, description: 'Mục nội dung trên trang.' }
}

export const ADMIN_PAGES = [
  { slug: 'home', label: 'Trang chủ', icon: House, sections: [['hero','hero'],['why','why'],['solutions','solutionOverview'],['proofMetrics','proofMetrics'],['trustedBy','trustedLogos'],['solutionClusters','solutionClusters'],['testimonials','testimonials'],['cta','cta'],['faq','faq'],['footerCta','cta']] },
  { slug: 'solutions', label: 'Giải pháp', icon: Layers, sections: [['hero','hero'],['groups','solutionGroups'],['modules','solutionModules'],['trustedBy','trustedLogos'],['cta','cta'],['faq','faq']] },
].map(page => ({ ...page, sections: page.sections.map(([key, type]) => [key, getSectionMetadata(type, key).label]) }))
