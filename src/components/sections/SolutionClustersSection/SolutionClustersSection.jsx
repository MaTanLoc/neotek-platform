import { createSkeletonItems } from '../../../utils/skeleton'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

const CLUSTER_KEYS = ['business', 'supplyChain', 'manufacturing', 'management']

const clusterIcons = {
  business: Briefcase04Icon,
  supplyChain: Blockchain04Icon,
  manufacturing: Settings01Icon,
  management: FolderManagementIcon,
}

function plainText(value) {
  if (typeof value !== 'string') return value ?? ''

  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>\s*<p[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The CMS stores Solution Clusters as one flat `items` array:
 *
 * 4 cluster records:
 *   business / supplyChain / manufacturing / management
 *
 * plus module records:
 *   crm / marketing / mua-hang / kho / ...
 *   each linked by `clusterKey`.
 *
 * The public component needs a grouped presentation model. Keep the DB/API
 * contract flat and normalize only at this rendering boundary.
 */
function normalizeClusters(source) {
  if (!Array.isArray(source) || source.length === 0) return []


  // Already-grouped data remains supported for skeletons/older adapters.
  const alreadyGrouped = source.some(
    item => CLUSTER_KEYS.includes(item?.clusterKey) && Array.isArray(item?.modules),
  )

  if (alreadyGrouped) {
    return source
      .filter(item => CLUSTER_KEYS.includes(item?.clusterKey))
      .map(item => ({
        ...item,
        id: item.id || item.clusterKey,
        label: item.label || item.title || '',
        description: plainText(item.description),
        media: item.media || item.image || '',
        modules: (item.modules || []).map(module => ({
          ...module,
          id: module.id || module.key || module.title,
        })),
      }))
  }

  const clustersByKey = new Map()
  const modulesByCluster = new Map(CLUSTER_KEYS.map(key => [key, []]))

  source.forEach((item, index) => {
    if (!item) return

    const key = String(item.key || '')
    const owner = String(item.clusterKey || '')

    if (CLUSTER_KEYS.includes(key)) {
      clustersByKey.set(key, {
        ...item,
        id: item.id || key,
        clusterKey: key,
        label: item.label || item.title || '',
        description: plainText(item.description),
        media: item.media || item.image || '',
        modules: [],
      })
      return
    }

    if (CLUSTER_KEYS.includes(owner)) {
      modulesByCluster.get(owner).push({
        ...item,
        id: item.id || item.key || `${owner}-module-${index}`,
        title: item.title || item.label || item.key || '',
      })
    }
  })

  return CLUSTER_KEYS
    .map(key => {
      const cluster = clustersByKey.get(key)
      if (!cluster) return null

      return {
        ...cluster,
        modules: modulesByCluster.get(key) || [],
      }
    })
    .filter(Boolean)
}

function ClusterVisual({ cluster }) {
  if (!cluster?.media) {
    return (
      <div className="solution-clusters__visual skeleton-block">
        <div className="solution-clusters__visual-glow" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="solution-clusters__visual skeleton-block">
      <div className="solution-clusters__visual-glow" aria-hidden="true" />

      <div className="solution-clusters__media">
        <img
          src={cluster.media}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  )
}

export function SolutionClustersSection({
  copy = {},
  clusters = [],
  loading = false,
  error = null,
}) {
  const { t, i18n } = useTranslation()
  const sectionRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  const normalizedClusters = useMemo(
    () => normalizeClusters(clusters, i18n.resolvedLanguage || i18n.language),
    [clusters, i18n.resolvedLanguage, i18n.language],
  )

  const visibleClusters = loading
    ? createSkeletonItems(4, 'cluster').map((item, index) => {
      const clusterKey = CLUSTER_KEYS[index] || item.id
      return {
        ...item,
        clusterKey,
        label: '████████ ████████',
        title: '████████ ████████ ████████',
        description: '████████ ████████ ████████ ████████ ████████ ████████',
        modules: createSkeletonItems(4, item.id).map(module => ({
          ...module,
          title: '████████',
        })),
      }
    })
    : normalizedClusters

  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (normalizedClusters.length === 0) {
      setActiveId(null)
      return
    }

    setActiveId(current => {
      const exists = normalizedClusters.some(
        cluster => cluster.clusterKey === current,
      )

      return exists ? current : normalizedClusters[0].clusterKey
    })
  }, [normalizedClusters])

  const active =
    visibleClusters.find(cluster => cluster.clusterKey === activeId) ??
    visibleClusters[0]

  useLayoutEffect(() => {
    if (
      loading ||
      prefersReducedMotion ||
      error ||
      normalizedClusters.length === 0
    ) {
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
  }, [
    loading,
    prefersReducedMotion,
    error,
    normalizedClusters.length,
  ])

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
            {(copy.eyebrow || '')}
          </p>

          <h2
            id="solution-clusters-title"
            className="solution-clusters__title"
          >
            {(copy.title || '')}{' '}
            <span>{(copy.titleHighlight || '')}</span>
          </h2>

          <p className="solution-clusters__description">
            {(copy.description || '')}
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
              {visibleClusters.map(cluster => {
                const isActive = cluster.clusterKey === active?.clusterKey
                const icon = clusterIcons[cluster.clusterKey] ?? null

                return (
                  <button
                    key={cluster.id || cluster.clusterKey}
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
                    <div
                      className="solution-clusters__modules"
                      aria-label={t('solutionClusters.modulesAria', {
                        defaultValue: 'Phân hệ',
                      })}
                    >
                      {active.modules.map(module => (
                        <span
                          className="skeleton-target"
                          key={module.id || module.key}
                        >
                          {module.title}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <NeotekButton
                    href={loading ? undefined : copy.ctaUrl || undefined}
                    disabled={loading}
                    className="solution-clusters__cta skeleton-target"
                  >
                    <span className="solution-clusters__cta-text">
                      {(copy.ctaLabel || '')}
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
