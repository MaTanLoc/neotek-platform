import { useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { useReducedMotion } from 'motion/react'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'
import './TrustedBySection.css'

const trustedLogos = [
  { id: 'logo-3', src: '/assets/3.png', alt: 'Logo doanh nghiệp đối tác 3' },
  { id: 'lam-hiep-hung', src: '/assets/lam hiep hung.png', alt: 'Logo Lâm Hiệp Hưng' },
  { id: 'daidung', src: '/assets/daidung.jpg', alt: 'Logo Đại Dũng' },
  { id: 'komtek', src: '/assets/komtek.png', alt: 'Logo Komtek' },
  { id: 'logo-2', src: '/assets/2.png', alt: 'Logo doanh nghiệp đối tác 2' },
  { id: 'huy-viet-tay-do', src: '/assets/huy viet tay do.png', alt: 'Logo Huy Việt Tây Đô' },
  { id: 'logo-5', src: '/assets/5.png', alt: 'Logo doanh nghiệp đối tác 5' },
  { id: 'logo-1', src: '/assets/1.png', alt: 'Logo doanh nghiệp đối tác 1' },
  { id: 'bakertilly-ac', src: '/assets/BakerTilly AC.png', alt: 'Logo BakerTilly AC' },
  { id: 'logo-4', src: '/assets/4.png', alt: 'Logo doanh nghiệp đối tác 4' },
]

function LogoItem({ logo, ariaHidden = false }) {
  return (
    <div className="trusted-by-logo-item" data-logo={logo.id} aria-hidden={ariaHidden || undefined}>
      <img src={logo.src} alt={ariaHidden ? '' : logo.alt} loading="lazy" />
    </div>
  )
}

export function TrustedBySection() {
  const prefersReducedMotion = useReducedMotion()
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      dragFree: true,
      containScroll: false,
    },
    [
      AutoScroll({
        speed: 0.9,
        playOnInit: !prefersReducedMotion,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
      }),
    ],
  )

  useEffect(() => {
    if (!emblaApi) {
      return undefined
    }

    const autoScroll = emblaApi.plugins().autoScroll
    if (!autoScroll) {
      return undefined
    }

    if (prefersReducedMotion) {
      autoScroll.stop()
    } else {
      autoScroll.play()
    }

    return undefined
  }, [emblaApi, prefersReducedMotion])

  return (
    <NeotekSection className="trusted-by-section" aria-labelledby="trusted-by-heading">
      <NeotekContainer className="trusted-by-container">
        <h2 id="trusted-by-heading" className="trusted-by-title">
          Được tin tưởng bởi các doanh nghiệp trong nhiều lĩnh vực
        </h2>

        <div className="trusted-by-viewport" ref={emblaRef}>
          <div className="trusted-by-track">
            {trustedLogos.map((logo) => (
              <LogoItem key={logo.id} logo={logo} />
            ))}
            {trustedLogos.map((logo) => (
              <LogoItem key={`${logo.id}-duplicate`} logo={logo} ariaHidden />
            ))}
          </div>
        </div>
      </NeotekContainer>
    </NeotekSection>
  )
}
