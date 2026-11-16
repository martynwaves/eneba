import { useEffect } from 'react'

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} | Eneba` : 'Eneba | Buy Games, Gift Cards & Top Ups Cheaper'
  }, [title])
}
