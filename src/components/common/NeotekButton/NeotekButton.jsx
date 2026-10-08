import { isPublicHrefEnabled } from '../../../config/features'

export function NeotekButton({ children, className = '', href, variant = 'primary', ...props }) { if (href && !isPublicHrefEnabled(href)) return null; const classes = `neotek-button neotek-button--${variant} ${className}`.trim(); return href ? <a className={classes} href={href} {...props}>{children}</a> : <button className={classes} type="button" {...props}>{children}</button> }
