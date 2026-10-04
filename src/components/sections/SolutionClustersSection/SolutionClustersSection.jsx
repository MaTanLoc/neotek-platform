import { createSkeletonItems } from '../../../utils/skeleton'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Briefcase04Icon,
  Blockchain04Icon,
  Settings01Icon,
  FolderManagementIcon,
} from '@hugeicons/core-free-icons'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { NeotekButton } from '../../common/NeotekButton/NeotekButton'
import { NeotekContainer } from '../../common/NeotekContainer/NeotekContainer'
import { NeotekSection } from '../../common/NeotekSection/NeotekSection'

import './SolutionClustersSection.css'

gsap.registerPlugin(ScrollTrigger)

const clusterIcons = {
  business: Briefcase04Icon,
  supplyChain: Blockchain04Icon,
  manufacturing: Settings01Icon,
  management: FolderManagementIcon,
}

function ClusterVisual({ cluster }) {
  if (!cluster?.media) {
    return (
      <div className="solution-clusters__visual skeleton-block">
        <div
          className="solution-clusters__visual-glow"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <div className="solution-clusters__visual skeleton-block">
      <div
        className="solution-clusters__visual-glow"
        aria-hidden="true"
      />

      <div className="solution-clusters__media">
        <img
          src={cluster.media}
          alt=""
          loading="lazy" decoding="async"
        />
      </div>
    </div>
  )
}

export function SolutionClustersSection({
  clusters = [],
  loading = false,
  error = null,
}) {
  const { t } = useTranslation()
  const sectionRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()
  const visibleClusters = loading ? createSkeletonItems(4, 'cluster').map((item) => ({ ...item, clusterKey: item.id, label: '████████ ████████', title: '████████ ████████ ████████', description: '████████ ████████ ████████ ████████ ████████ ████████', modules: createSkeletonItems(4, item.id).map((module) => ({ ...module, title: '████████' })) })) : clusters
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (clusters.length === 0) {
      setActiveId(null)
      return
    }

    setActiveId((current) => {
      const exists = clusters.some(
        (cluster) => cluster.clusterKey === current,
      )

      return exists ? current : clusters[0].clusterKey
    })
  }, [clusters])

  const active =
    visibleClusters.find((cluster) => cluster.clusterKey === activeId) ??
    visibleClusters[0]

  useLayoutEffect(() => {
    if (loading || prefersReducedMotion || error || clusters.length === 0) {
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 72%',
            once: true,
          },
        })
        .from('.solution-clusters__eyebrow', {
          y: 18,
          opacity: 0,
          duration: 0.5,
          ease: 'power3.out',
        })
        .from(
          '.solution-clusters__title',
          {
            y: 28,
            opacity: 0,
            duration: 0.65,
            ease: 'power3.out',
          },
          '-=0.3',
        )
        .from(
          '.solution-clusters__description',
          {
            y: 20,
            opacity: 0,
            duration: 0.55,
            ease: 'power3.out',
          },
          '-=0.4',
        )
        .from(
          '.solution-clusters__tabs',
          {
            y: 24,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out',
          },
          '-=0.25',
        )
        .from(
          '.solution-clusters__panel',
          {
            y: 42,
            opacity: 0,
            duration: 0.75,
            ease: 'power3.out',
          },
          '-=0.35',
        )
    }, sectionRef)

    return () => ctx.revert()
  }, [loading, prefersReducedMotion, error, clusters.length])

  return (
    <NeotekSection
      ref={sectionRef}
      className={`solution-clusters${loading ? ' is-loading' : ''}`}
      aria-busy={loading}
      aria-labelledby="solution-clusters-title"
    >
      <NeotekContainer>
        <div className="solution-clusters__intro">
          <p className="solution-clusters__eyebrow">
            {t('solutionClusters.eyebrow')}
          </p>

          <h2
            id="solution-clusters-title"
            className="solution-clusters__title"
          >
            {t('solutionClusters.titleBefore')}{' '}
            <span>{t('solutionClusters.titleHighlight')}</span>
          </h2>

          <p className="solution-clusters__description">
            {t('solutionClusters.description')}
          </p>
        </div>

        {(loading || !error) && visibleClusters.length > 0 ? (
          <>
            <div
              className="solution-clusters__tabs"
                aria-hidden={loading || undefined}
                inert={loading ? '' : undefined}
              role="tablist"
              aria-label={t('solutionClusters.aria')}
            >
              {visibleClusters.map((cluster) => {
                const isActive = cluster.clusterKey === active.clusterKey
                const icon = clusterIcons[cluster.clusterKey] ?? null

                return (
                  <button
                    key={cluster.id}
                    type="button"
                    role="tab"
                    disabled={loading}
                    aria-selected={isActive}
                    className={`solution-clusters__tab skeleton-target ${isActive ? 'is-active' : ''
                      }`}
                    onClick={() => setActiveId(cluster.clusterKey)}
                  >
                    {icon ? (
                      <HugeiconsIcon
                        className="solution-clusters__icon"
                        icon={icon}
                        size={21}
                        color="currentColor"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    ) : null}

                    <span>{cluster.label}</span>
                  </button>
                )
              })}
            </div>

            {active ? (
              <div
                className="solution-clusters__panel"
                aria-hidden={loading || undefined}
                inert={loading ? '' : undefined}
                key={active.clusterKey}
              >
                <div className="solution-clusters__copy">
                  <h3 className="skeleton-target">{active.title}</h3>
                  <p className="skeleton-target">{active.description}</p>

                  {active.modules?.length > 0 ? (
                    <div className="solution-clusters__modules">
                      {active.modules.map((module) => (
                        <span className="skeleton-target" key={module.id}>{module.title}</span>
                      ))}
                    </div>
                  ) : null}

                  <NeotekButton
                    href={loading ? undefined : "/solutions"}
                    disabled={loading}
                    className="solution-clusters__cta skeleton-target"
                  >
                    <span className="solution-clusters__cta-text">
                      {t('solutionClusters.cta')}
                    </span>

                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                      className="solution-clusters__cta-arrow"
                    />
                  </NeotekButton>
                </div>

                <ClusterVisual cluster={active} />
              </div>
            ) : null}
          </>
        ) : null}
      </NeotekContainer>
    </NeotekSection>
  )
}
