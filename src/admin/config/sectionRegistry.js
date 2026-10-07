import {createElement, useState} from 'react'
import {EditorTabs, BilingualPanel, EditorPanel} from '../editors/shared/EditorPrimitives'
import {HeroEditor} from '../editors/home/HeroEditor'
import {SolutionsHeroEditor} from '../editors/solutions/SolutionsHeroEditor'
import {CollectionSectionEditor} from '../editors/shared-sections/CollectionSectionEditor'
import {SolutionOverviewEditor} from '../editors/home/SolutionOverviewEditor'
import {SharedCtaEditor} from '../editors/shared-sections/SharedCtaEditor'
import {SectionCopyPanel} from '../editors/shared/SectionCopyPanel'
import {ProofMetricActionsPanel} from '../editors/home/ProofMetricActionsPanel'

const collectionTypes = ['why', 'proofMetrics', 'trustedLogos', 'solutionClusters', 'testimonials', 'faq', 'solutionGroups', 'solutionModules']
export const bilingualTypes = new Set(['hero', 'cta', 'solutionOverview', ...collectionTypes])
export function resolveEditor({ pageSlug, sectionKey, type }) {
  if (type === 'hero') return pageSlug === 'solutions' && sectionKey === 'hero' ? SolutionsHeroEditor : HeroEditor
  return sectionEditors[type]
}
const copyFields = { why: ['title', 'titleHighlight', 'description'], proofMetrics: ['title', 'description'], trustedLogos: ['title'], testimonials: ['title'], faq: ['eyebrow', 'title', 'description', 'ctaLabel'], solutionClusters: ['eyebrow', 'title', 'titleHighlight', 'description', 'ctaLabel'], solutionGroups: ['eyebrow', 'title', 'titleHighlight', 'description'], solutionModules: [] }
function collection(type) {
  function Editor(props) {
    const [tab, setTab] = useState('items')
    const vi = props.value
    const en = props.pairedValue
    const copy = createElement(BilingualPanel, { vi: createElement(SectionCopyPanel, { value: vi, names: copyFields[type], onChange: props.onChange }), en: createElement(SectionCopyPanel, { value: en, names: copyFields[type], onChange: props.onPairedChange }) })
    const settings = createElement(EditorPanel, null, copy, ['faq', 'solutionClusters'].includes(type) && createElement('label', null, 'Liên kết CTA', createElement('input', { value: vi?.ctaUrl || '', onChange: event => { props.onChange({ ...props.value, ctaUrl: event.target.value }); props.onPairedChange({ ...props.pairedValue, ctaUrl: event.target.value }) } }), createElement('small', { className: 'admin-muted' }, '/solutions, /booking, https://')))
    const items = createElement(CollectionSectionEditor, { ...props, type })
    const tabs = [['items', type === 'testimonials' ? 'Đánh giá' : 'Danh sách', items]]
    if (type === 'proofMetrics') tabs.push(['actions', 'Nút hành động', createElement(ProofMetricActionsPanel, props)])
    return createElement('div', { className: 'admin-standard-editor' }, copyFields[type].length ? createElement(EditorPanel, { title: 'Thiết lập section' }, settings) : null, tabs.length > 1 ? createElement(EditorTabs, { value: tab, onChange: setTab, tabs }) : items)
  }
  return Editor
}
// Named domain editors share one configurable collection implementation.
export const WhyEditor = collection('why')
export const ProofMetricsEditor = collection('proofMetrics')
export const SolutionClustersEditor = collection('solutionClusters')
export const TestimonialsEditor = collection('testimonials')
export const SolutionGroupsEditor = collection('solutionGroups')
export const SolutionModulesEditor = collection('solutionModules')
export const SharedFaqEditor = collection('faq')
export const SharedTrustedEditor = collection('trustedLogos')
export { SharedCtaEditor }
export const sectionEditors = { hero: HeroEditor, solutionOverview: SolutionOverviewEditor, cta: SharedCtaEditor, why: WhyEditor, proofMetrics: ProofMetricsEditor, solutionClusters: SolutionClustersEditor, testimonials: TestimonialsEditor, solutionGroups: SolutionGroupsEditor, solutionModules: SolutionModulesEditor, faq: SharedFaqEditor, trustedLogos: SharedTrustedEditor }
