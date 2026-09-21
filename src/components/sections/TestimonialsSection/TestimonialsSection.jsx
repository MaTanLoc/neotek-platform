import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useReducedMotion } from 'motion/react'
import { Quote } from 'lucide-react'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'
import './TestimonialsSection.css'

const testimonials = [
  {
    id: 'demo-01',
    quote: 'NeoTek giúp doanh nghiệp kết nối dữ liệu và quy trình trên một nền tảng thống nhất, từ đó việc theo dõi và điều hành trở nên rõ ràng hơn.',
    person: 'Nguyễn Minh Anh',
    role: 'Giám đốc điều hành',
    organization: 'Doanh nghiệp Demo A',
    avatar: 'https://www.misa.vn/sites/misa/images/pages/home-page-v3/kim-son.webp',
    logo: null,
    isDemo: true,
  },
  {
    id: 'demo-02',
    quote: 'Điểm chúng tôi đánh giá cao ở NeoTek là khả năng liên kết các bộ phận và dữ liệu trong cùng một hệ thống quản trị.',
    person: 'Trần Hoàng Nam',
    role: 'Giám đốc vận hành',
    organization: 'Doanh nghiệp Demo B',
    avatar: null,
    logo: null,
    isDemo: true,
  },
  {
    id: 'demo-03',
    quote: 'Việc chuẩn hóa quy trình trên một nền tảng chung giúp đội ngũ có thêm cơ sở để theo dõi và phối hợp công việc.',
    person: 'Lê Minh Quân',
    role: 'Giám đốc tài chính',
    organization: 'Doanh nghiệp Demo C',
    avatar: null,
    logo: null,
    isDemo: true,
  },
  {
    id: 'demo-04',
    quote: 'Một hệ thống quản trị tích hợp giúp doanh nghiệp có cái nhìn xuyên suốt hơn về hoạt động và dữ liệu vận hành.',
    person: 'Phạm Thu Hà',
    role: 'Giám đốc nhân sự',
    organization: 'Doanh nghiệp Demo D',
    avatar: null,
    logo: null,
    isDemo: true,
  },
]

function TestimonialCard({ testimonial }) {
  const hasContent = testimonial.isDemo || testimonial.quote

  return (
    <article className="testimonial-card">
      {testimonial.isDemo ? <span className="testimonial-card__demo-label">DEMO</span> : null}
      <div className="testimonial-card__quote-mark" aria-hidden="true">
        <Quote size={22} strokeWidth={1.7} />
      </div>

      {hasContent ? (
        <>
          <blockquote className="testimonial-card__quote">{testimonial.quote}</blockquote>
          <footer className="testimonial-card__footer">
            {testimonial.avatar ? (
              <div className="testimonial-card__avatar-wrap">
                <img
                  className="testimonial-card__avatar"
                  src={testimonial.avatar}
                  alt="Ảnh minh họa demo"
                  onError={(event) => {
                    event.currentTarget.hidden = true
                    event.currentTarget.nextElementSibling.hidden = false
                  }}
                />
                <span className="testimonial-card__avatar-fallback" hidden aria-hidden="true">NM</span>
              </div>
            ) : null}
            <div>
              {testimonial.person ? <p className="testimonial-card__person">{testimonial.person}</p> : null}
              {testimonial.role ? <p className="testimonial-card__meta">{testimonial.role}</p> : null}
              {testimonial.organization ? <p className="testimonial-card__meta">{testimonial.organization}</p> : null}
            </div>
            {testimonial.logo ? <img className="testimonial-card__logo" src={testimonial.logo} alt="" /> : null}
          </footer>
        </>
      ) : (
        <div className="testimonial-card__placeholder">
          <p>Nội dung phản hồi khách hàng và đối tác đang chờ dữ liệu được xác thực.</p>
          <span>Dữ liệu testimonial: TODO</span>
        </div>
      )}
    </article>
  )
}

export function TestimonialsSection() {
  const prefersReducedMotion = useReducedMotion()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    loop: testimonials.length > 1,
    skipSnaps: false,
  })

  const scrollTo = useCallback((index) => {
    emblaApi?.scrollTo(index)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) {
      return undefined
    }

    const handleSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', handleSelect)
    handleSelect()

    return () => emblaApi.off('select', handleSelect)
  }, [emblaApi])

  return (
    <NeotekSection className="testimonials-section" aria-labelledby="testimonials-heading">
      <NeotekContainer className="testimonials-container">
        <div className="testimonials-heading">
          <h2 id="testimonials-heading" className="testimonials-heading__title">Ý kiến khách hàng & đối tác</h2>
        </div>

        <div className="testimonials-viewport" ref={emblaRef} aria-roledescription="carousel" aria-label="Ý kiến khách hàng và đối tác">
          <div className="testimonials-track">
            {testimonials.map((testimonial) => (
              <div className="testimonials-slide" key={testimonial.id} role="group" aria-roledescription="slide" aria-label="Dữ liệu testimonial đang chờ cập nhật">
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>

        {testimonials.length > 1 ? (
          <div className="testimonials-pagination" role="tablist" aria-label="Chọn testimonial">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial.id}
                type="button"
                className={`testimonials-pagination__dot ${selectedIndex === index ? 'is-active' : ''}`}
                onClick={() => scrollTo(index)}
                aria-label={`Chuyển tới testimonial ${index + 1}`}
                aria-selected={selectedIndex === index}
                role="tab"
              />
            ))}
          </div>
        ) : null}

        {prefersReducedMotion ? <span className="sr-only">Chuyển động carousel đã tắt.</span> : null}
      </NeotekContainer>
    </NeotekSection>
  )
}
