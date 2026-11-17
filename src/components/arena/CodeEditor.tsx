import { useEffect, useMemo, useState } from 'react'
import CodeMirror, { EditorView, keymap, Prec } from '@uiw/react-codemirror'
import { Check, CloudOff, FileCode2, Save, Settings2 } from 'lucide-react'
import type { Extension } from '@uiw/react-codemirror'
import type { LanguageId } from '../../types/arena'
import type { DraftSaveStatus } from '../../hooks/useDraft'
import { languages } from '../../data/starterCode'

const languageLoaders: Record<LanguageId, () => Promise<Extension>> = {
  python: () => import('@codemirror/lang-python').then(module => module.python()),
  java: () => import('@codemirror/lang-java').then(module => module.java()),
  cpp: () => import('@codemirror/lang-cpp').then(module => module.cpp()),
  javascript: () => import('@codemirror/lang-javascript').then(module => module.javascript()),
}
const raceTheme = EditorView.theme({
  '&': { height: '100%', color: '#e8e6f0', backgroundColor: '#101116' },
  '.cm-scroller': { fontFamily: 'Consolas, "Courier New", monospace', lineHeight: '1.7', overflow: 'auto' },
  '.cm-content': { paddingTop: '13px', paddingBottom: '30px', caretColor: '#fff' },
  '.cm-gutters': { backgroundColor: '#101116', color: '#707482', borderRight: '1px solid #23252d', paddingRight: '5px' },
  '.cm-activeLine': { backgroundColor: '#ffffff04' }, '.cm-activeLineGutter': { color: '#f0f0f5', backgroundColor: '#ffffff04' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#76323d66' },
  '.cm-cursor': { borderLeftColor: '#ff665c' }, '.cm-foldPlaceholder': { background: '#242631', border: 'none', color: '#b4b7c6' },
  '.cm-tooltip': { backgroundColor: '#20222b', border: '1px solid #484b5b', color: '#f5f5f5' },
}, { dark: true })
interface Props {
  readOnly?: boolean; language: LanguageId; code: string; onChange: (value: string) => void; onLanguage: (value: LanguageId) => void
  saveStatus: DraftSaveStatus; onSave: () => void; busy: boolean; onRun: () => void; onSubmit: () => void
}
export function CodeEditor({ readOnly = false, language, code, onChange, onLanguage, saveStatus, onSave, busy, onRun, onSubmit }: Props) {
  const [syntax, setSyntax] = useState<Extension>([])
  const [syntaxError, setSyntaxError] = useState(false)
  useEffect(() => {
    let active = true
    languageLoaders[language]().then(extension => { if (active) setSyntax(extension) }).catch(() => { if (active) setSyntaxError(true) })
    return () => { active = false }
  }, [language])
  const [fontSize, setFontSize] = useState(13)
  const [wrap, setWrap] = useState(false)
  const selected = languages.find(item => item.id === language)!
  const extensions = useMemo(() => [
    syntax,
    raceTheme,
    EditorView.contentAttributes.of({ 'aria-label': `${language} source code`, 'aria-describedby': 'arena-code-help' }),
    EditorView.theme({ '.cm-scroller': { fontSize: `${fontSize}px` } }),
    ...(wrap ? [EditorView.lineWrapping] : []),
    Prec.highest(keymap.of([
      { key: 'Mod-Enter', run: () => { onRun(); return true } },
      { key: 'Mod-Shift-Enter', run: () => { onSubmit(); return true } },
      { key: 'Mod-s', run: () => { onSave(); return true } },
      { key: 'Escape', run: view => { view.contentDOM.blur(); document.getElementById('arena-language')?.focus(); return false } },
    ])),
  ], [syntax, language, fontSize, wrap, onRun, onSubmit, onSave])
  const saveLabel = saveStatus === 'saved' ? 'Draft Saved' : saveStatus === 'pending' ? 'Saving…' : saveStatus === 'error' ? 'Not saved to storage' : 'Starter template'
  return <div className="arena-code-editor"><div className="arena-editor-toolbar"><label className="sr-only" htmlFor="arena-language">Programming language</label><select id="arena-language" value={language} onChange={event => onLanguage(event.target.value as LanguageId)} disabled={busy || readOnly}>{languages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><span className="arena-file-name"><FileCode2 size={12} />{selected.fileName}</span><span className={'arena-draft-state draft-' + saveStatus} role="status">{saveStatus === 'saved' ? <Check size={12} /> : saveStatus === 'error' ? <CloudOff size={13} /> : <span className="draft-state-dot" />}{saveLabel}</span><button className="arena-icon-button" onClick={onSave} aria-label={saveStatus === 'error' ? 'Retry saving draft' : 'Save draft now'} title="Save draft (Ctrl/Cmd+S)"><Save size={15} /></button><details className="arena-editor-preferences"><summary aria-label="Editor preferences" title="Editor preferences"><Settings2 size={16} /></summary><div><label>Font size<select aria-label="Editor font size" value={fontSize} onChange={event => setFontSize(Number(event.target.value))}><option value={12}>12 px</option><option value={13}>13 px</option><option value={14}>14 px</option><option value={16}>16 px</option></select></label><label className="arena-wrap-setting"><input type="checkbox" checked={wrap} onChange={event => setWrap(event.target.checked)} />Wrap long lines</label><p>Esc returns focus to the language selector.</p></div></details></div>{syntaxError && <div className="arena-storage-warning" role="status">Syntax highlighting could not load. Editing and autosave are still available; refresh to retry.</div>}{saveStatus === 'error' && <div className="arena-storage-warning" role="status">Local storage is unavailable. Keep a backup of your code; this tab retains an in-memory draft.</div>}<span id="arena-code-help" className="sr-only">Ctrl or Command Enter runs code. Add Shift to submit. Ctrl or Command S saves. Escape returns focus to the language selector.</span><div className="arena-codemirror-host"><CodeMirror editable={!readOnly} readOnly={readOnly} value={code} height="100%" theme="dark" extensions={extensions} onChange={onChange} indentWithTab basicSetup={{ lineNumbers: true, foldGutter: true, bracketMatching: true, closeBrackets: true, autocompletion: true, highlightActiveLine: true, highlightSelectionMatches: true }} aria-label={`${selected.label} source code editor`} /></div></div>
}
