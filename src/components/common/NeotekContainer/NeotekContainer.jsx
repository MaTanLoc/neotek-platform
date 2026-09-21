export function NeotekContainer({ children, className = '', ...props }) { return <div className={`neotek-container ${className}`.trim()} {...props}>{children}</div> }
