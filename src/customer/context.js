import { createContext, useContext } from 'react'
export const CustomerContext = createContext(null)
export const useCustomer = () => useContext(CustomerContext)
