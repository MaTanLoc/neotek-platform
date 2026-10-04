import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

// Runs inside BrowserRouter without recreating the app-level smoother.
export function SmoothScrollRouteSync() {
   const { pathname } = useLocation()

   useLayoutEffect(() => {
      const frameId = requestAnimationFrame(() => {
         ScrollSmoother.get()?.scrollTo(0, false)
         ScrollTrigger.refresh()
      })

      return () => cancelAnimationFrame(frameId)
   }, [pathname])

   return null
}

export function SmoothScroll({ children }) {
   useLayoutEffect(() => {
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
   }, [])

   return children
}
