import { motion, useReducedMotion } from 'motion/react'
import { BarChart3, Building2, Database, GitBranch, Network } from 'lucide-react'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'
import './WhySection.css'

const whyItems = [
  {
    id: 'centralized-data',
    icon: Database,
    title: 'Dữ liệu tập trung',
    description:
      'Thông tin được quản lý tập trung, giúp các bộ phận và đơn vị truy cập, tìm kiếm và khai thác dữ liệu trên cùng một hệ thống.',
  },
  {
    id: 'end-to-end-link',
    icon: Network,
    title: 'Liên kết xuyên suốt',
    description:
      'Dữ liệu được kế thừa giữa các nghiệp vụ, hạn chế nhập liệu lặp lại và giúp các bộ phận phối hợp trên cùng một nguồn thông tin.',
  },
  {
    id: 'clear-process',
    icon: GitBranch,
    title: 'Quy trình rõ ràng',
    description:
      'Các quy trình phê duyệt có thể được thực hiện trực tuyến theo điều kiện và cấp phê duyệt được thiết lập.',
  },
  {
    id: 'multi-entity',
    icon: Building2,
    title: 'Quản trị đa đơn vị',
    description:
      'Với mô hình nhiều công ty hoặc chi nhánh, dữ liệu có thể được quản lý tập trung và đồng nhất, hỗ trợ theo dõi hoạt động toàn hệ thống.',
  },
  {
    id: 'timely-info',
    icon: BarChart3,
    title: 'Thông tin kịp thời',
    description:
      'Hệ thống cung cấp báo cáo và thông tin quản trị nhanh chóng, hỗ trợ người quản trị nắm bắt tình hình của toàn hệ thống.',
  },
]

export function WhySection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <NeotekSection className="why-section" aria-labelledby="why-neotek-title">
      <NeotekContainer>
        <motion.div
          className="why-section__intro"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <h2 id="why-neotek-title" className="why-section__title">
            <span id="why-neotek-title-text">Vì sao Doanh nghiệp cần</span>
            <span>một nền tảng quản trị tích hợp?</span>
          </h2>
          <p className="why-section__description">
            Khi doanh nghiệp phát triển, dữ liệu và quy trình ngày càng phức tạp. NeoTek giúp kết
            nối các bộ phận trên một hệ thống quản trị thống nhất.
          </p>
        </motion.div>

        <motion.div
          className="why-proof-grid"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
        >
          {whyItems.map((item, index) => {
            const Icon = item.icon

            return (
              <motion.article
                key={item.id}
                className="why-proof-item"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 * index }}
              >
                <div className="why-proof-item__icon-wrap">
                  <div className="why-proof-item__icon" aria-hidden="true">
                    <Icon size={24} />
                  </div>
                </div>

                <div className="why-proof-item__title">{item.title}</div>
                <p className="why-proof-item__description">{item.description}</p>
              </motion.article>
            )
          })}
        </motion.div>
      </NeotekContainer>
    </NeotekSection>
  )
}
