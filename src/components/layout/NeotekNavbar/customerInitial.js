export function customerInitial(customer) {
  return Array.from(customer?.name?.trim() || customer?.email?.trim() || '?')[0].toLocaleUpperCase()
}
