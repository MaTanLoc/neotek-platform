import {lazy, Suspense} from 'react'

const Home = lazy(() => import('../../../components/home/HeroCarousel/HomeHeroView').then(module => ({ default: module.HomeHeroView })))
const Solutions = lazy(() => import('../../../pages/solutions/SolutionsHeroView').then(module => ({ default: module.SolutionsHeroView })))
const Trusted = lazy(() => import('../../../components/sections/TrustedBySection/TrustedBySection').then(module => ({ default: module.TrustedByView })))

const Cluster = lazy(() => import('../../../pages/solutions/SolutionsPage').then(module => ({ default: module.SolutionCluster })))

function PreviewView({ view: View, ...props }) {
  return <Suspense fallback={<small className="admin-muted" role="status">Đang tải xem trước…</small>}><View {...props} /></Suspense>
}
export function HomeHeroView(props) { return <PreviewView view={Home} {...props} /> }
export function SolutionsHeroView(props) { return <PreviewView view={Solutions} {...props} /> }
export function TrustedByView(props) { return <PreviewView view={Trusted} {...props} /> }

export function SolutionClusterView(props) { return <PreviewView view={Cluster} {...props} /> }
