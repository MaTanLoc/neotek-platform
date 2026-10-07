import {createContext, useContext} from 'react'
export const CmsContext = createContext(null)
export function useCms() { return useContext(CmsContext) }
