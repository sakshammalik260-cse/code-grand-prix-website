import { useCallback, useState } from 'react'
import { BookOpen } from 'lucide-react'
import type { LanguageId } from '../../types/arena'
import { SyntaxLibraryModal } from './SyntaxLibrary/SyntaxLibraryModal'

interface Props {
  language: LanguageId
  allowed: boolean
}

export function SyntaxGuide({ language, allowed }: Props) {
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback(() => {
    if (allowed) {
      setOpen(true)
    }
  }, [allowed])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <>
      <button
        type="button"
        className="arena-syntax-button"
        onClick={handleOpen}
        disabled={!allowed}
        aria-label="Open Syntax Library Reference"
        title="Open Syntax Reference (Free / Zero Penalty)"
      >
        <BookOpen size={13} />
        <span>SYNTAX GUIDE</span>
      </button>

      {open && allowed && (
        <SyntaxLibraryModal
          initialLanguage={language}
          onClose={handleClose}
        />
      )}
    </>
  )
}
