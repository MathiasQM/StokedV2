declare global {
  interface Window {
    Plaid: {
      create: (...args: any[]) => { open: () => void; exit: (o?: any) => void }
    }
  }
}
export {}
