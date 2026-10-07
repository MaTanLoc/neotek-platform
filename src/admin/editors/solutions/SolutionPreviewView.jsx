import {SolutionClusterView} from '../shared/PublicPreviewViews'
import {DraftPreviewPanel} from '../shared/DraftPreviewPanel'
import {GROUP_ICONS} from '../../../pages/solutions/solutionPresentation'

import {htmlText} from '../../utils/content'

export function SolutionPreviewView({ group, modules, language }) {
  const normalized = { ...group, id: `draft-${group.key}-${language}`, description: htmlText(group.description), icon: GROUP_ICONS[group.icon] || GROUP_ICONS[group.key] || GROUP_ICONS.business }
  const entries = Object.fromEntries(modules.map(item => [item.key, { ...item, description: htmlText(item.description) }]))
  return <DraftPreviewPanel label={`Solutions draft ${language}`}><div className="solutions-page"><div className="solutions-clusters__list"><SolutionClusterView key={normalized.id + normalized.modules.join('-')} group={normalized} modules={entries} prefersReducedMotion language={language} /></div></div></DraftPreviewPanel>
}
