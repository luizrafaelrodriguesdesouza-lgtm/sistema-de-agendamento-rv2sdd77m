import { useState, useEffect } from 'react'

type Listener = () => void
let selectedOwnerId: string | null = null
const listeners = new Set<Listener>()

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setMasterOwnerId(id: string | null) {
  selectedOwnerId = id
  listeners.forEach((l) => l())
}

export default function useMasterStore() {
  const [val, setVal] = useState<string | null>(selectedOwnerId)

  useEffect(() => {
    return subscribe(() => {
      setVal(selectedOwnerId)
    })
  }, [])

  return { selectedOwnerId: val, setSelectedOwnerId: setMasterOwnerId }
}
