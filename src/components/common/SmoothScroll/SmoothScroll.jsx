import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

// eslint-disable-next-line react-refresh/only-export-components -- Shared with the locale control that drives this scroll boundary.
export function captureLocaleScroll() {
   const y = ScrollSmoother.get()?.scrollTop() ?? window.scrollY
   const headings = [...document.querySelectorAll('.solution-article h2[id]')]
   const heading = headings.filter(item => item.getBoundingClientRect().top <= 180).at(-1)
   return {
      ratio: y / Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
      headingIndex: heading ? headings.indexOf(heading) : -1,
      headingOffset: heading?.getBoundingClientRect().top ?? 0,
   }
}

// Runs inside BrowserRouter without recreating the app-level smoother.
export function SmoothScrollRouteSync() {
   const { pathname, state, key } = useLocation()
   const navigationType = useNavigationType()

   useLayoutEffect(() => {
      let frameId
      let observer
      let timer
      const restore = () => {
         const smoother = ScrollSmoother.get()
         ScrollTrigger.refresh()
         const snapshot = navigationType === 'POP' ? null : state?.localeScroll
         if (snapshot) {
            const heading = document.querySelectorAll('.solution-article h2[id]')[snapshot.headingIndex]
            const y = heading
               ? (smoother?.scrollTop() ?? window.scrollY) + heading.getBoundingClientRect().top - snapshot.headingOffset
               : snapshot.ratio * Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
            if (smoother) smoother.scrollTop(y)
            else window.scrollTo({ top: y, behavior: 'instant' })
         } else if (navigationType !== 'POP') {
            if (smoother) smoother.scrollTo(0, false)
            else window.scrollTo({ top: 0, behavior: 'instant' })
         }
      }
      frameId = requestAnimationFrame(restore)
      if (navigationType !== 'POP' && state?.localeScroll) {
         // Localized CMS data and images can settle after the route commits.
         observer = new ResizeObserver(() => {
            cancelAnimationFrame(frameId)
            frameId = requestAnimationFrame(restore)
         })
         observer.observe(document.getElementById('smooth-content'))
         timer = setTimeout(() => observer.disconnect(), 2500)
      }
      const stopRestore = () => { observer?.disconnect(); cancelAnimationFrame(frameId) }
      window.addEventListener('wheel', stopRestore, { passive: true })
      window.addEventListener('touchstart', stopRestore, { passive: true })
      window.addEventListener('keydown', stopRestore)

      return () => {
         cancelAnimationFrame(frameId); observer?.disconnect(); clearTimeout(timer)
         window.removeEventListener('wheel', stopRestore)
         window.removeEventListener('touchstart', stopRestore)
         window.removeEventListener('keydown', stopRestore)
      }
   }, [pathname, key, state, navigationType])

   return null
}

export function SmoothScroll({ children }) {
   const { pathname } = useLocation()
   // Scheduling and account lists use native page scrolling, including touch and keyboard navigation.
   const nativeScroll = /^\/(?:en\/)?(?:booking|account\/bookings)(?:\/|$)/.test(pathname) || /^\/admin\/bookings(?:\/|$)/.test(pathname)
   useLayoutEffect(() => {
      if (nativeScroll) return
      const smoother = ScrollSmoother.create({
         wrapper: '#smooth-wrapper',
         content: '#smooth-content',
         smooth: 0.9,
         smoothTouch: 0.1,
         effects: false,
      })

      return () => {
         smoother.kill()
      }
   }, [nativeScroll])

   return children
}
