import { forwardRef } from 'react'

export const NeotekSection = forwardRef(function NeotekSection({ children, className = '', tone = 'default', ...props }, ref) {
	return <section ref={ref} className={`neotek-section neotek-section--${tone} ${className}`.trim()} {...props}>{children}</section>
})
