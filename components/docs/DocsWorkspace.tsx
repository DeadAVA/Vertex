'use client'

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  CalendarDays,
  CaseLower,
  CaseUpper,
  Check,
  ChevronDown,
  Clock3,
  Cloud,
  CloudOff,
  Copy,
  Download,
  Eraser,
  Eye,
  FileCog,
  FileText,
  Grid3X3,
  HelpCircle,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize,
  Minus,
  MoreVertical,
  PaintBucket,
  Pilcrow,
  Plus,
  Printer,
  Quote,
  Redo2,
  RemoveFormatting,
  Replace,
  Save,
  Search,
  Share2,
  Sparkles,
  Star,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Trash2,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AcademicPanel } from '@/components/docs/AcademicPanel'

type DocumentItem = {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  updatedAt: string
}

type Props = { initialDocuments?: DocumentItem[] }
type SaveState = 'saved' | 'saving' | 'error'
type MenuName = 'file' | 'edit' | 'view' | 'insert' | 'format' | 'tools' | 'help'
type PaperSize = 'letter' | 'a4' | 'legal' | 'a3' | 'a5' | 'executive'
type PageSettings = {
  paperSize: PaperSize
  orientation: 'portrait' | 'landscape'
  margins: { top: number; right: number; bottom: number; left: number }
  headerEnabled: boolean
  headerText: string
  firstHeaderText: string
  headerAlign: 'left' | 'center' | 'right'
  footerEnabled: boolean
  footerText: string
  firstFooterText: string
  footerAlign: 'left' | 'center' | 'right'
  differentFirstPage: boolean
  pageNumberEnabled: boolean
  pageNumberPosition: 'header' | 'footer'
  pageNumberAlign: 'left' | 'center' | 'right'
  pageNumberFormat: 'arabic' | 'roman-lower' | 'roman-upper' | 'alpha-lower' | 'alpha-upper'
  pageNumberStyle: 'number' | 'page-number' | 'number-total'
  pageNumberStart: number
  hideNumberOnFirstPage: boolean
  pageColor: string
}

const blankDocument = '<p><br></p>'
const fontSizes = Array.from({ length: 68 }, (_, index) => index + 5)
const fontFamilies = ['Arial', 'Calibri', 'Cambria', 'Comic Sans MS', 'Courier New', 'Garamond', 'Georgia', 'Helvetica', 'Impact', 'Inter', 'Roboto', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana']
const paperSizes: Record<PaperSize, { label: string; widthMm: number; heightMm: number }> = {
  letter: { label: 'Carta (21.59 × 27.94 cm)', widthMm: 215.9, heightMm: 279.4 },
  a4: { label: 'A4 (21 × 29.7 cm)', widthMm: 210, heightMm: 297 },
  legal: { label: 'Legal (21.59 × 35.56 cm)', widthMm: 215.9, heightMm: 355.6 },
  a3: { label: 'A3 (29.7 × 42 cm)', widthMm: 297, heightMm: 420 },
  a5: { label: 'A5 (14.8 × 21 cm)', widthMm: 148, heightMm: 210 },
  executive: { label: 'Ejecutivo (18.4 × 26.7 cm)', widthMm: 184.2, heightMm: 266.7 },
}
const defaultPageSettings: PageSettings = {
  paperSize: 'letter', orientation: 'portrait', margins: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 },
  headerEnabled: false, headerText: '', firstHeaderText: '', headerAlign: 'left', footerEnabled: false, footerText: '', firstFooterText: '', footerAlign: 'left', differentFirstPage: false,
  pageNumberEnabled: false, pageNumberPosition: 'footer', pageNumberAlign: 'center', pageNumberFormat: 'arabic', pageNumberStyle: 'number', pageNumberStart: 1, hideNumberOnFirstPage: false,
  pageColor: '#ffffff',
}

function parseStoredContent(content: string) {
  const match = content.match(/<span\s+data-doc-settings="([^"]+)"[^>]*><\/span>/i)
  if (!match) return { body: content, settings: defaultPageSettings }
  try {
    const stored = JSON.parse(decodeURIComponent(match[1])) as Partial<PageSettings>
    return {
      body: content.replace(match[0], ''),
      settings: { ...defaultPageSettings, ...stored, margins: { ...defaultPageSettings.margins, ...stored.margins } },
    }
  } catch {
    return { body: content.replace(match[0], ''), settings: defaultPageSettings }
  }
}

function serializeContent(body: string, settings: PageSettings) {
  return `<span data-doc-settings="${encodeURIComponent(JSON.stringify(settings))}" contenteditable="false"></span>${body}`
}

function romanNumber(value: number) {
  const pairs: Array<[number, string]> = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let number = Math.max(1, Math.floor(value))
  let result = ''
  pairs.forEach(([amount, symbol]) => { while (number >= amount) { result += symbol; number -= amount } })
  return result
}

function formatPageNumber(value: number, format: PageSettings['pageNumberFormat']) {
  if (format === 'roman-lower') return romanNumber(value).toLowerCase()
  if (format === 'roman-upper') return romanNumber(value)
  if (format === 'alpha-lower' || format === 'alpha-upper') {
    let number = Math.max(1, Math.floor(value))
    let result = ''
    while (number > 0) { number -= 1; result = String.fromCharCode(65 + (number % 26)) + result; number = Math.floor(number / 26) }
    return format === 'alpha-lower' ? result.toLowerCase() : result
  }
  return String(value)
}

function paginateHtml(html: string, contentWidth: number, contentHeight: number) {
  if (typeof window === 'undefined') return [html || '<p><br></p>']
  const source = window.document.createElement('div')
  source.innerHTML = html || '<p><br></p>'
  const measure = window.document.createElement('div')
  measure.className = 'docs-editor docs-page-content'
  Object.assign(measure.style, { position: 'fixed', visibility: 'hidden', pointerEvents: 'none', left: '-10000px', top: '0', width: `${Math.max(120, contentWidth)}px`, minHeight: '0', height: 'auto', padding: '0', overflow: 'visible' })
  window.document.body.appendChild(measure)
  const pages: string[] = []
  let fragmentCounter = 0
  const flush = () => {
    pages.push(measure.innerHTML || '<p><br></p>')
    measure.innerHTML = ''
  }

  const sliceElement = (element: HTMLElement, start: number, end: number) => {
    const wrapper = element.cloneNode(false) as HTMLElement
    const range = window.document.createRange()
    range.selectNodeContents(element)
    const setBoundary = (offset: number, beginning: boolean) => {
      const walker = window.document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      let remaining = offset
      let textNode = walker.nextNode()
      while (textNode) {
        const length = textNode.textContent?.length ?? 0
        if (remaining <= length) {
          if (beginning) range.setStart(textNode, remaining)
          else range.setEnd(textNode, remaining)
          return
        }
        remaining -= length
        textNode = walker.nextNode()
      }
    }
    if (start > 0) setBoundary(start, true)
    if (end < (element.textContent?.length ?? 0)) setBoundary(end, false)
    wrapper.appendChild(range.cloneContents())
    return wrapper
  }

  const placeNode = (node: Node) => {
    const clone = node.cloneNode(true)
    const manualBreak = clone instanceof HTMLElement && clone.classList.contains('docs-page-break')
    if (manualBreak) {
      measure.appendChild(clone)
      flush()
      return
    }
    measure.appendChild(clone)
    if (measure.scrollHeight > contentHeight && measure.childNodes.length > 1) {
      measure.removeChild(clone)
      flush()
      measure.appendChild(clone)
    }
    if (measure.scrollHeight > contentHeight && measure.childNodes.length === 1 && clone instanceof HTMLElement) {
      const textLength = clone.textContent?.length ?? 0
      if (textLength > 1 && !clone.matches('table,img,svg,.docs-academic-block')) {
        let low = 1
        let high = textLength - 1
        let fit = 0
        while (low <= high) {
          const middle = Math.floor((low + high) / 2)
          const left = sliceElement(clone, 0, middle)
          measure.replaceChildren(left)
          if (measure.scrollHeight <= contentHeight) { fit = middle; low = middle + 1 } else high = middle - 1
        }
        if (fit > 0 && fit < textLength) {
          const value = clone.textContent ?? ''
          const wordBoundary = value.lastIndexOf(' ', fit)
          if (wordBoundary > Math.max(1, fit - 40)) fit = wordBoundary + 1
          const fragmentId = clone.dataset.pageFragment || `page-fragment-${fragmentCounter += 1}`
          const leftFragment = sliceElement(clone, 0, fit)
          const rightFragment = sliceElement(clone, fit, textLength)
          leftFragment.dataset.pageFragment = fragmentId
          rightFragment.dataset.pageFragment = fragmentId
          if (!clone.dataset.pageContinuation) leftFragment.removeAttribute('data-page-continuation')
          rightFragment.dataset.pageContinuation = 'true'
          measure.replaceChildren(leftFragment)
          flush()
          placeNode(rightFragment)
        } else {
          measure.replaceChildren(clone)
        }
      }
    }
  }

  Array.from(source.childNodes).forEach(placeNode)
  if (measure.childNodes.length || !pages.length) flush()
  measure.remove()
  return pages
}

function mergePageFragments(html: string) {
  if (typeof window === 'undefined' || !html.includes('data-page-fragment')) return html
  const root = window.document.createElement('div')
  root.innerHTML = html
  const fragments = Array.from(root.querySelectorAll<HTMLElement>('[data-page-fragment]'))
  const firstById = new Map<string, HTMLElement>()
  fragments.forEach((fragment) => {
    const id = fragment.dataset.pageFragment
    if (!id) return
    const first = firstById.get(id)
    if (!first) {
      firstById.set(id, fragment)
      fragment.removeAttribute('data-page-fragment')
      fragment.removeAttribute('data-page-continuation')
      return
    }
    while (fragment.firstChild) first.appendChild(fragment.firstChild)
    fragment.remove()
  })
  return root.innerHTML
}

const templates = [
  { name: 'En blanco', color: '#ffffff', accent: '#4285f4', content: blankDocument },
  {
    name: 'Informe',
    color: '#f7f1e8',
    accent: '#d97706',
    content: '<h1>Informe</h1><p><strong>Preparado por:</strong> Tu nombre</p><h2>Resumen</h2><p>Escribe aquí un breve resumen del informe.</p><h2>Desarrollo</h2><p>Agrega los hallazgos y la información principal.</p><h2>Conclusiones</h2><p>Resume los puntos más importantes.</p>',
  },
  {
    name: 'Notas de clase',
    color: '#eef6ff',
    accent: '#2563eb',
    content: '<h1>Notas de clase</h1><p><strong>Materia:</strong> </p><p><strong>Fecha:</strong> </p><h2>Temas principales</h2><ul><li>Primer tema</li><li>Segundo tema</li></ul><h2>Resumen</h2><p>Escribe tus notas aquí.</p>',
  },
  {
    name: 'Plan de proyecto',
    color: '#eef8f0',
    accent: '#188038',
    content: '<h1>Plan de proyecto</h1><h2>Objetivo</h2><p>Describe el objetivo principal.</p><h2>Actividades</h2><ol><li>Primera actividad</li><li>Segunda actividad</li></ol><h2>Próximos pasos</h2><p>Define responsables y fechas.</p>',
  },
]

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function sanitizeHtml(value: string) {
  return value
    .replace(/<(script|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|iframe|object|embed)[^>]*\/?\s*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '')
}

function normalizeContent(content: string) {
  if (!content.trim()) return '<p><br></p>'
  if (/<[a-z][\s\S]*>/i.test(content)) return sanitizeHtml(content)

  return content
    .split('\n')
    .map((line) => {
      const safe = escapeHtml(line)
      if (line.startsWith('### ')) return `<h3>${safe.slice(4)}</h3>`
      if (line.startsWith('## ')) return `<h2>${safe.slice(3)}</h2>`
      if (line.startsWith('# ')) return `<h1>${safe.slice(2)}</h1>`
      if (line.startsWith('- ')) return `<ul><li>${safe.slice(2)}</li></ul>`
      return line.trim() ? `<p>${safe}</p>` : '<p><br></p>'
    })
    .join('')
}

function plainText(content: string) {
  if (typeof window === 'undefined') return content.replace(/<[^>]*>/g, ' ')
  const node = window.document.createElement('div')
  node.innerHTML = content
  return node.textContent ?? ''
}

export default function DocsWorkspace({ initialDocuments = [] }: Props) {
  const [documents, setDocuments] = useState(initialDocuments.map((doc) => ({ ...doc, content: normalizeContent(doc.content) })))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('Documento sin título')
  const [draftContent, setDraftContent] = useState(blankDocument)
  const [draftCategory, setDraftCategory] = useState('General')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [menu, setMenu] = useState<MenuName | null>(null)
  const [wordCountOpen, setWordCountOpen] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [pageSetupOpen, setPageSetupOpen] = useState(false)
  const [pageSettings, setPageSettings] = useState<PageSettings>(defaultPageSettings)
  const [pages, setPages] = useState<string[]>([blankDocument])
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [headerFooterEditing, setHeaderFooterEditing] = useState<{ pageIndex: number; section: 'header' | 'footer' } | null>(null)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [showRuler, setShowRuler] = useState(true)
  const [showStatus, setShowStatus] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [spellCheck, setSpellCheck] = useState(true)
  const [blockType, setBlockType] = useState('p')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontSize, setFontSize] = useState(11)
  const [lineHeight, setLineHeight] = useState('1.5')
  const [academicPanelOpen, setAcademicPanelOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const editorRef = useRef<HTMLDivElement | null>(null)
  const canvasViewportRef = useRef<HTMLElement | null>(null)
  const pageRefs = useRef<Array<HTMLDivElement | null>>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const revisionRef = useRef(0)
  const contentRef = useRef(draftContent)
  const selectionRef = useRef<Range | null>(null)
  const pendingCaretRef = useRef<number | null>(null)
  const paginationTimerRef = useRef<number | null>(null)
  const heldEditingKeyRef = useRef<'Enter' | 'Backspace' | null>(null)

  const selectedDoc = useMemo(() => documents.find((doc) => doc.id === selectedId) ?? null, [documents, selectedId])
  const pageCount = pages.length
  const pageDimensions = useMemo(() => {
    const paper = paperSizes[pageSettings.paperSize]
    const portrait = pageSettings.orientation === 'portrait'
    const widthMm = portrait ? paper.widthMm : paper.heightMm
    const heightMm = portrait ? paper.heightMm : paper.widthMm
    return { width: Math.round(widthMm * 96 / 25.4), height: Math.round(heightMm * 96 / 25.4), widthMm, heightMm }
  }, [pageSettings.orientation, pageSettings.paperSize])
  const contentDimensions = useMemo(() => ({
    width: pageDimensions.width - (pageSettings.margins.left + pageSettings.margins.right) * 96 / 2.54,
    height: pageDimensions.height - (pageSettings.margins.top + pageSettings.margins.bottom) * 96 / 2.54,
  }), [pageDimensions, pageSettings.margins])
  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    if (!term) return documents
    return documents.filter((doc) => `${doc.title} ${plainText(doc.content)}`.toLocaleLowerCase('es').includes(term))
  }, [documents, search])

  const words = useMemo(() => plainText(draftContent).trim().split(/\s+/).filter(Boolean), [draftContent])

  useEffect(() => {
    revisionRef.current = revision
  }, [revision])

  useEffect(() => {
    const savedZoom = Number(window.localStorage.getItem('vertex-docs-zoom'))
    if (Number.isFinite(savedZoom) && savedZoom >= 25 && savedZoom <= 250) setZoom(savedZoom)
  }, [])

  useEffect(() => {
    contentRef.current = draftContent
  }, [draftContent])

  useEffect(() => {
    if (!selectedId || revision === 0) return
    const snapshotRevision = revision
    setSaveState('saving')
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/docs/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: draftTitle.trim() || 'Documento sin título', content: serializeContent(draftContent, pageSettings), category: draftCategory }),
        })
        if (!response.ok) throw new Error('No se pudo guardar')
        const data = await response.json()
        setDocuments((current) => current.map((doc) => (doc.id === data.document.id ? data.document : doc)))
        if (revisionRef.current === snapshotRevision) {
          setRevision(0)
          setSaveState('saved')
        }
      } catch {
        setSaveState('error')
      }
    }, 800)
    return () => window.clearTimeout(timer)
  }, [draftCategory, draftContent, draftTitle, pageSettings, revision, selectedId])

  useLayoutEffect(() => {
    if (!selectedId) return
    pageRefs.current = pageRefs.current.slice(0, pages.length)
    pages.forEach((content, index) => {
      const page = pageRefs.current[index]
      if (page && page.innerHTML !== content) page.innerHTML = content
    })
    if (!editorRef.current || !pageRefs.current.includes(editorRef.current)) editorRef.current = pageRefs.current[0]
    const markerPageIndex = pageRefs.current.findIndex((page) => page?.querySelector('[data-pagination-caret]'))
    if (markerPageIndex >= 0) {
      const page = pageRefs.current[markerPageIndex]!
      const marker = page.querySelector('[data-pagination-caret]')!
      const range = window.document.createRange()
      range.setStartBefore(marker)
      range.collapse(true)
      marker.remove()
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      selectionRef.current = range.cloneRange()
      editorRef.current = page
      pendingCaretRef.current = null
      setActivePageIndex(markerPageIndex)
      page.focus()
      return
    }
    if (pendingCaretRef.current !== null) {
      const offset = pendingCaretRef.current
      pendingCaretRef.current = null
      restoreCaretOffset(offset)
    }
  }, [pages, selectedId])

  useEffect(() => {
    if (!selectedId) return
    const nextPages = paginateHtml(draftContent, contentDimensions.width, contentDimensions.height)
    pendingCaretRef.current = caretOffset()
    setPages(nextPages)
  }, [contentDimensions.height, contentDimensions.width, pageSettings.orientation, pageSettings.paperSize, selectedId])

  useEffect(() => () => {
    if (paginationTimerRef.current !== null) window.clearTimeout(paginationTimerRef.current)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    function onKeyDown(event: KeyboardEvent) {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveNow()
      }
      if (modifier && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setFindOpen(true)
        setMenu(null)
      }
      if (event.key === 'Escape') setMenu(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, draftCategory, draftContent, draftTitle, pageSettings])

  function markEdited() {
    setRevision((value) => value + 1)
    setSaveState('saving')
  }

  function updateZoom(value: number) {
    const next = Math.min(250, Math.max(25, Math.round(value)))
    setZoom(next)
    window.localStorage.setItem('vertex-docs-zoom', String(next))
  }

  function fitZoom(mode: 'width' | 'page') {
    const viewport = canvasViewportRef.current
    if (!viewport) return
    const widthZoom = ((viewport.clientWidth - 72) / pageDimensions.width) * 100
    const heightZoom = ((viewport.clientHeight - 48) / pageDimensions.height) * 100
    updateZoom(mode === 'page' ? Math.min(widthZoom, heightZoom) : widthZoom)
  }

  function currentDocumentHtml() {
    return mergePageFragments(pageRefs.current.map((page) => page?.innerHTML ?? '').join('') || draftContent)
  }

  function caretOffset() {
    const selection = window.getSelection()
    if (!selection?.rangeCount) return null
    const range = selection.getRangeAt(0)
    const pageIndex = pageRefs.current.findIndex((page) => page?.contains(range.startContainer))
    if (pageIndex < 0) return null
    let offset = pageRefs.current.slice(0, pageIndex).reduce((total, page) => total + (page?.textContent?.length ?? 0), 0)
    const before = window.document.createRange()
    before.selectNodeContents(pageRefs.current[pageIndex]!)
    before.setEnd(range.startContainer, range.startOffset)
    offset += before.toString().length
    return offset
  }

  function caretIsAtPageStart(page: HTMLDivElement) {
    const selection = window.getSelection()
    if (!selection?.rangeCount || !selection.isCollapsed) return false
    const activeRange = selection.getRangeAt(0)
    if (!page.contains(activeRange.startContainer)) return false
    const before = window.document.createRange()
    before.selectNodeContents(page)
    before.setEnd(activeRange.startContainer, activeRange.startOffset)
    const holder = window.document.createElement('div')
    holder.appendChild(before.cloneContents())
    const hasText = Boolean(holder.textContent?.replace(/\uFEFF/g, ''))
    const hasVisualContent = Boolean(holder.querySelector('br,img,svg,hr,table,.docs-academic-block,.docs-page-break'))
    return !hasText && !hasVisualContent
  }

  function restoreCaretOffset(offset: number) {
    let remaining = Math.max(0, offset)
    for (let pageIndex = 0; pageIndex < pageRefs.current.length; pageIndex += 1) {
      const page = pageRefs.current[pageIndex]
      if (!page) continue
      const length = page.textContent?.length ?? 0
      if (remaining <= length) {
        const walker = window.document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
        let node = walker.nextNode()
        while (node) {
          const nodeLength = node.textContent?.length ?? 0
          if (remaining <= nodeLength) {
            const range = window.document.createRange()
            range.setStart(node, remaining)
            range.collapse(true)
            const selection = window.getSelection()
            selection?.removeAllRanges()
            selection?.addRange(range)
            selectionRef.current = range.cloneRange()
            editorRef.current = page
            setActivePageIndex(pageIndex)
            page.focus()
            return
          }
          remaining -= nodeLength
          node = walker.nextNode()
        }
        page.focus()
        return
      }
      remaining -= length
    }
    const lastPage = pageRefs.current.filter(Boolean).at(-1)
    if (lastPage) {
      const range = window.document.createRange()
      range.selectNodeContents(lastPage)
      range.collapse(false)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      selectionRef.current = range.cloneRange()
      editorRef.current = lastPage
      setActivePageIndex(Math.max(0, pageRefs.current.filter(Boolean).length - 1))
      lastPage.focus()
    }
  }

  function repaginate() {
    const html = currentDocumentHtml()
    let nextPages = paginateHtml(html, contentDimensions.width, contentDimensions.height)
    const currentPages = pageRefs.current.map((page) => page?.innerHTML ?? '')
    if (nextPages.length === currentPages.length && nextPages.every((page, index) => page === currentPages[index])) return
    const fallbackOffset = caretOffset()
    const selection = window.getSelection()
    const activeRange = selection?.rangeCount ? selection.getRangeAt(0) : null
    const activePage = activeRange ? pageRefs.current.find((page) => page?.contains(activeRange.startContainer)) : null
    if (activeRange && activePage) {
      const marker = window.document.createElement('span')
      marker.dataset.paginationCaret = 'true'
      marker.setAttribute('aria-hidden', 'true')
      marker.textContent = '\uFEFF'
      const markerRange = activeRange.cloneRange()
      markerRange.collapse(true)
      markerRange.insertNode(marker)
      const markedHtml = currentDocumentHtml()
      marker.remove()
      nextPages = paginateHtml(markedHtml, contentDimensions.width, contentDimensions.height)
      pendingCaretRef.current = null
    } else {
      pendingCaretRef.current = fallbackOffset
    }
    setPages(nextPages)
  }

  function schedulePagination() {
    if (paginationTimerRef.current !== null) window.clearTimeout(paginationTimerRef.current)
    paginationTimerRef.current = window.setTimeout(() => {
      paginationTimerRef.current = null
      repaginate()
    }, 40)
  }

  function deleteAcrossPageBoundary(pageIndex: number) {
    const previousPage = pageRefs.current[pageIndex - 1]
    const currentPage = pageRefs.current[pageIndex]
    if (!previousPage) return
    const currentHasContent = Boolean(currentPage?.textContent?.replace(/\uFEFF/g, '') || currentPage?.querySelector('img,svg,hr,table,.docs-academic-block'))
    if (currentPage && !currentHasContent) currentPage.innerHTML = ''
    const trailingBreak = previousPage.lastElementChild
    if (trailingBreak?.classList.contains('docs-page-break')) trailingBreak.remove()
    const range = window.document.createRange()
    range.selectNodeContents(previousPage)
    range.collapse(false)
    if (currentPage && !currentHasContent) {
      const marker = window.document.createElement('span')
      marker.dataset.paginationCaret = 'true'
      marker.setAttribute('aria-hidden', 'true')
      marker.textContent = '\uFEFF'
      range.insertNode(marker)
      const compactedPages = pageRefs.current
        .map((page) => page?.innerHTML ?? '')
        .filter((_, index) => index !== pageIndex)
      contentRef.current = mergePageFragments(compactedPages.join(''))
      setDraftContent(contentRef.current)
      markEdited()
      setPages(compactedPages)
      return
    }
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    selectionRef.current = range.cloneRange()
    editorRef.current = previousPage
    setActivePageIndex(pageIndex - 1)
    previousPage.focus()
    syncEditor()
  }

  function updatePageSettings(patch: Partial<PageSettings>) {
    setPageSettings((current) => ({ ...current, ...patch }))
    markEdited()
  }

  function syncEditor() {
    if (!editorRef.current) return
    const content = currentDocumentHtml()
    if (content === contentRef.current) return
    contentRef.current = content
    setDraftContent(content)
    markEdited()
    if (!heldEditingKeyRef.current) schedulePagination()
  }

  function captureEditorSelection() {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return
    selectionRef.current = range.cloneRange()
    setSelectedText(selection.toString())
    const element = (range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement) as HTMLElement | null
    if (!element) return
    const block = element.closest('h1,h2,h3,h4,h5,h6,p,blockquote,pre')
    setBlockType(block?.tagName.toLowerCase() ?? 'p')
    const style = window.getComputedStyle(element)
    const family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim()
    const points = Math.round(Number.parseFloat(style.fontSize) * 0.75)
    if (family) setFontFamily(family)
    if (Number.isFinite(points)) setFontSize(Math.min(72, Math.max(5, points)))
    setLineHeight(style.lineHeight === 'normal' ? '1.2' : String(Math.round((Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize)) * 100) / 100))
  }

  function restoreEditorSelection() {
    const editor = editorRef.current
    const range = selectionRef.current
    if (!editor) return false
    editor.focus()
    if (!range || !editor.contains(range.commonAncestorContainer)) return false
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    return true
  }

  function insertAcademicHtml(html: string, replaceSelection = false) {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    let range = selectionRef.current?.cloneRange() ?? null
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = window.document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
    } else if (!replaceSelection) {
      range.collapse(false)
    }
    selection?.removeAllRanges()
    selection?.addRange(range)
    window.document.execCommand('insertHTML', false, html)
    setSelectedText('')
    selectionRef.current = null
    syncEditor()
  }

  async function createDocument(template = templates[0]) {
    setBusy(true)
    try {
      const response = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: template.name === 'En blanco' ? 'Documento sin título' : template.name, content: template.content, category: 'General' }),
      })
      if (!response.ok) throw new Error('No se pudo crear el documento')
      const data = await response.json()
      const document = { ...data.document, content: normalizeContent(data.document.content) }
      setDocuments((current) => [document, ...current])
      openDocument(document)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo crear el documento')
    } finally {
      setBusy(false)
    }
  }

  function openDocument(doc: DocumentItem) {
    const stored = parseStoredContent(normalizeContent(doc.content))
    const content = stored.body
    setSelectedId(doc.id)
    setDraftTitle(doc.title)
    setDraftCategory(doc.category || 'General')
    setPageSettings(stored.settings)
    contentRef.current = content
    setDraftContent(content)
    setPages([content])
    setActivePageIndex(0)
    setRevision(0)
    setSaveState('saved')
    setMenu(null)
  }

  async function closeDocument() {
    if (selectedId && revisionRef.current > 0) {
      setSaveState('saving')
      try {
        const content = currentDocumentHtml()
        const response = await fetch(`/api/docs/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: draftTitle.trim() || 'Documento sin título', content: serializeContent(content, pageSettings), category: draftCategory }),
        })
        if (!response.ok) throw new Error()
        const data = await response.json()
        setDocuments((current) => current.map((doc) => (doc.id === data.document.id ? data.document : doc)))
      } catch {
        setSaveState('error')
        window.alert('No se pudo guardar el último cambio. Revisa tu conexión e inténtalo de nuevo.')
        return
      }
    }
    setRevision(0)
    setSaveState('saved')
    setSelectedId(null)
  }

  async function deleteDocument(doc = selectedDoc) {
    if (!doc || !window.confirm(`¿Mover “${doc.title}” a la papelera?`)) return
    setBusy(true)
    try {
      const response = await fetch(`/api/docs/${doc.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('No se pudo eliminar el documento')
      setDocuments((current) => current.filter((item) => item.id !== doc.id))
      if (selectedId === doc.id) setSelectedId(null)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el documento')
    } finally {
      setBusy(false)
    }
  }

  async function duplicateDocument() {
    if (!selectedDoc) return
    const response = await fetch('/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Copia de ${draftTitle}`, content: serializeContent(draftContent, pageSettings), category: 'General' }),
    })
    if (!response.ok) return window.alert('No se pudo crear la copia')
    const data = await response.json()
    setDocuments((current) => [data.document, ...current])
    openDocument(data.document)
  }

  function run(command: string, value?: string) {
    restoreEditorSelection()
    window.document.execCommand(command, false, value)
    captureEditorSelection()
    syncEditor()
  }

  function setTextSize(size: number) {
    const normalized = Math.min(72, Math.max(5, Math.round(size)))
    restoreEditorSelection()
    window.document.execCommand('fontSize', false, '7')
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = window.document.createElement('span')
      span.style.fontSize = `${normalized}pt`
      while (font.firstChild) span.appendChild(font.firstChild)
      font.replaceWith(span)
    })
    setFontSize(normalized)
    captureEditorSelection()
    syncEditor()
  }

  function selectedBlocks() {
    const editor = editorRef.current
    const range = selectionRef.current
    if (!editor || !range) return [] as HTMLElement[]
    const selector = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,div.docs-academic-block'
    const start = (range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement) as HTMLElement | null
    if (range.collapsed) {
      const block = start?.closest(selector)
      return block && editor.contains(block) ? [block as HTMLElement] : []
    }
    return Array.from(editor.querySelectorAll<HTMLElement>(selector)).filter((node) => {
      try { return range.intersectsNode(node) } catch { return false }
    })
  }

  function setParagraphSpacing(value: string) {
    restoreEditorSelection()
    const blocks = selectedBlocks()
    if (!blocks.length && editorRef.current) blocks.push(editorRef.current)
    blocks.forEach((block) => { block.style.lineHeight = value })
    setLineHeight(value)
    syncEditor()
  }

  function transformSelection(transform: (value: string) => string) {
    restoreEditorSelection()
    const selection = window.getSelection()
    if (!selection?.toString()) return
    window.document.execCommand('insertText', false, transform(selection.toString()))
    syncEditor()
  }

  function insertHtml(html: string) {
    restoreEditorSelection()
    window.document.execCommand('insertHTML', false, html)
    syncEditor()
  }

  function insertTable() {
    const rows = Math.min(10, Math.max(1, Number(window.prompt('Número de filas (1–10)', '3')) || 0))
    if (!rows) return
    const columns = Math.min(10, Math.max(1, Number(window.prompt('Número de columnas (1–10)', '3')) || 0))
    if (!columns) return
    const cells = Array.from({ length: rows }, () => `<tr>${'<td><br></td>'.repeat(columns)}</tr>`).join('')
    insertHtml(`<table><tbody>${cells}</tbody></table><p><br></p>`)
  }

  function insertSpecialCharacter() {
    const character = window.prompt('Escribe o pega el símbolo que deseas insertar', '©')
    if (character) insertHtml(escapeHtml(character))
  }

  function findNext() {
    const needle = findText.trim().toLocaleLowerCase('es')
    if (!pageRefs.current.some(Boolean) || !needle) return
    const matches: Array<{ node: Node; start: number }> = []
    pageRefs.current.forEach((page) => {
      if (!page) return
      const walker = window.document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node) {
        const value = (node.textContent ?? '').toLocaleLowerCase('es')
        let index = value.indexOf(needle)
        while (index >= 0) {
          matches.push({ node, start: index })
          index = value.indexOf(needle, index + Math.max(1, needle.length))
        }
        node = walker.nextNode()
      }
    })
    if (!matches.length) return window.alert('No se encontró el texto.')
    const current = selectionRef.current
    const currentIndex = current ? matches.findIndex((match) => match.node === current.startContainer && match.start === current.startOffset) : -1
    const match = matches[(currentIndex + 1) % matches.length]
    const range = window.document.createRange()
    range.setStart(match.node, match.start)
    range.setEnd(match.node, match.start + findText.length)
    selectionRef.current = range
    editorRef.current = pageRefs.current.find((page) => page?.contains(match.node)) ?? editorRef.current
    restoreEditorSelection()
    match.node.parentElement?.scrollIntoView({ block: 'center' })
  }

  function replaceAll() {
    if (!pageRefs.current.some(Boolean) || !findText) return
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const expression = new RegExp(escaped, 'gi')
    const nodes: Node[] = []
    pageRefs.current.forEach((page) => {
      if (!page) return
      const walker = window.document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node) { nodes.push(node); node = walker.nextNode() }
    })
    let replacements = 0
    nodes.forEach((textNode) => {
      const original = textNode.textContent ?? ''
      const next = original.replace(expression, () => { replacements += 1; return replaceText })
      if (next !== original) textNode.textContent = next
    })
    if (replacements) syncEditor()
    window.alert(replacements ? `Se reemplazaron ${replacements} coincidencias.` : 'No se encontró el texto.')
  }

  function insertLink() {
    const url = window.prompt('Pega el enlace')
    if (url) run('createLink', url)
  }

  async function saveNow() {
    if (!selectedId) return
    const content = currentDocumentHtml()
    setDraftContent(content)
    setSaveState('saving')
    try {
      const response = await fetch(`/api/docs/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draftTitle.trim() || 'Documento sin título', content: serializeContent(content, pageSettings), category: draftCategory }),
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setDocuments((current) => current.map((doc) => (doc.id === data.document.id ? data.document : doc)))
      setRevision(0)
      setSaveState('saved')
    } catch {
      setSaveState('error')
      window.alert('No se pudo guardar el documento. Revisa tu conexión e inténtalo de nuevo.')
    }
  }

  function insertImage(file?: File) {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) return window.alert('La imagen debe pesar menos de 4 MB.')
    const reader = new FileReader()
    reader.onload = () => run('insertImage', String(reader.result))
    reader.readAsDataURL(file)
  }

  function pageNumberLabel(pageIndex: number, total = pageCount) {
    const value = formatPageNumber(pageSettings.pageNumberStart + pageIndex, pageSettings.pageNumberFormat)
    if (pageSettings.pageNumberStyle === 'page-number') return `Página ${value}`
    if (pageSettings.pageNumberStyle === 'number-total') return `${value} de ${formatPageNumber(pageSettings.pageNumberStart + total - 1, pageSettings.pageNumberFormat)}`
    return value
  }

  function runningText(value: string, pageIndex: number) {
    return value
      .replace(/\{t[ií]tulo\}/gi, draftTitle)
      .replace(/\{fecha\}/gi, new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date()))
      .replace(/\{p[aá]gina\}/gi, pageNumberLabel(pageIndex))
      .replace(/\{total\}/gi, String(pageCount))
  }

  function runningItems(position: 'header' | 'footer', align: 'left' | 'center' | 'right', pageIndex: number) {
    const items: string[] = []
    const headerText = pageIndex === 0 && pageSettings.differentFirstPage ? pageSettings.firstHeaderText : pageSettings.headerText
    const footerText = pageIndex === 0 && pageSettings.differentFirstPage ? pageSettings.firstFooterText : pageSettings.footerText
    if (position === 'header' && pageSettings.headerEnabled && pageSettings.headerAlign === align && headerText) items.push(runningText(headerText, pageIndex))
    if (position === 'footer' && pageSettings.footerEnabled && pageSettings.footerAlign === align && footerText) items.push(runningText(footerText, pageIndex))
    const showNumber = pageSettings.pageNumberEnabled && pageSettings.pageNumberPosition === position && pageSettings.pageNumberAlign === align && !(pageIndex === 0 && pageSettings.hideNumberOnFirstPage)
    if (showNumber) items.push(pageNumberLabel(pageIndex))
    return items.join(' · ')
  }

  function openHeaderFooter(pageIndex: number, section: 'header' | 'footer') {
    setActivePageIndex(pageIndex)
    setHeaderFooterEditing({ pageIndex, section })
    updatePageSettings(section === 'header' ? { headerEnabled: true } : { footerEnabled: true })
  }

  function directRunningText(position: 'header' | 'footer', pageIndex: number) {
    if (position === 'header') return pageIndex === 0 && pageSettings.differentFirstPage ? pageSettings.firstHeaderText : pageSettings.headerText
    return pageIndex === 0 && pageSettings.differentFirstPage ? pageSettings.firstFooterText : pageSettings.footerText
  }

  function updateDirectRunningText(position: 'header' | 'footer', pageIndex: number, value: string) {
    if (position === 'header') updatePageSettings(pageIndex === 0 && pageSettings.differentFirstPage ? { firstHeaderText: value, headerEnabled: true } : { headerText: value, headerEnabled: true })
    else updatePageSettings(pageIndex === 0 && pageSettings.differentFirstPage ? { firstFooterText: value, footerEnabled: true } : { footerText: value, footerEnabled: true })
  }

  function printRunningText(value: string) {
    return escapeHtml(value)
      .replace(/\{t[ií]tulo\}/gi, escapeHtml(draftTitle))
      .replace(/\{fecha\}/gi, escapeHtml(new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date())))
      .replace(/\{p[aá]gina\}/gi, '<span class="print-page-number"></span>')
      .replace(/\{total\}/gi, '<span class="print-page-total"></span>')
  }

  function printDocument() {
    const popup = window.open('', '_blank', 'width=900,height=700')
    if (!popup) return window.alert('Permite las ventanas emergentes para imprimir.')
    const content = currentDocumentHtml()
    const size = `${pageDimensions.widthMm}mm ${pageDimensions.heightMm}mm`
    const counterStyle = { arabic: 'decimal', 'roman-lower': 'lower-roman', 'roman-upper': 'upper-roman', 'alpha-lower': 'lower-alpha', 'alpha-upper': 'upper-alpha' }[pageSettings.pageNumberFormat]
    const numberPrefix = pageSettings.pageNumberStyle === 'page-number' ? 'Página ' : ''
    const numberSuffix = pageSettings.pageNumberStyle === 'number-total' ? ` de ${formatPageNumber(pageSettings.pageNumberStart + pageCount - 1, pageSettings.pageNumberFormat)}` : ''
    const printBand = (position: 'header' | 'footer') => {
      const staticEnabled = position === 'header' ? pageSettings.headerEnabled : pageSettings.footerEnabled
      const staticText = position === 'header' ? pageSettings.headerText : pageSettings.footerText
      const staticAlign = position === 'header' ? pageSettings.headerAlign : pageSettings.footerAlign
      const cells = (['left', 'center', 'right'] as const).map((align) => {
        const parts: string[] = []
        if (staticEnabled && staticAlign === align) parts.push(printRunningText(staticText))
        if (pageSettings.pageNumberEnabled && pageSettings.pageNumberPosition === position && pageSettings.pageNumberAlign === align) parts.push('<span class="print-auto-number"></span>')
        return `<span style="text-align:${align}">${parts.join(' · ')}</span>`
      }).join('')
      return `<div class="print-${position}">${cells}</div>`
    }
    const hasHeader = pageSettings.headerEnabled || (pageSettings.pageNumberEnabled && pageSettings.pageNumberPosition === 'header')
    const hasFooter = pageSettings.footerEnabled || (pageSettings.pageNumberEnabled && pageSettings.pageNumberPosition === 'footer')
    popup.document.write(`<html><head><meta charset="utf-8"><title>${escapeHtml(draftTitle)}</title><style>@page{size:${size};margin:${pageSettings.margins.top}cm ${pageSettings.margins.right}cm ${pageSettings.margins.bottom}cm ${pageSettings.margins.left}cm}body{font:11pt Arial,sans-serif;line-height:1.55;color:#202124;background:${pageSettings.pageColor};counter-reset:page ${pageSettings.pageNumberStart - 1}}h1{font-size:24pt}h2{font-size:18pt}img{max-width:100%}table{width:100%;border-collapse:collapse}td,th{border:1px solid #999;padding:6px}.docs-page-break{page-break-after:always}.print-header,.print-footer{position:fixed;left:0;right:0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font:9pt Arial,sans-serif;color:#5f6368}.print-header{top:-${Math.max(.5, pageSettings.margins.top * .72)}cm}.print-footer{bottom:-${Math.max(.5, pageSettings.margins.bottom * .72)}cm}.print-page-number:after,.print-auto-number:after{content:'${numberPrefix}' counter(page, ${counterStyle}) '${numberSuffix}'}.print-page-total:after{content:'${pageCount}'}</style></head><body>${hasHeader ? printBand('header') : ''}${hasFooter ? printBand('footer') : ''}${content}</body></html>`)
    popup.document.close()
    popup.focus()
    window.setTimeout(() => popup.print(), 250)
  }

  function exportBand(position: 'header' | 'footer') {
    const cells = (['left', 'center', 'right'] as const).map((align) => `<span style="text-align:${align}">${escapeHtml(runningItems(position, align, 0))}</span>`).join('')
    return `<div class="export-${position}">${cells}</div>`
  }

  function exportShell(content: string) {
    const headerVisible = pageSettings.headerEnabled || (pageSettings.pageNumberEnabled && pageSettings.pageNumberPosition === 'header' && !pageSettings.hideNumberOnFirstPage)
    const footerVisible = pageSettings.footerEnabled || (pageSettings.pageNumberEnabled && pageSettings.pageNumberPosition === 'footer' && !pageSettings.hideNumberOnFirstPage)
    return `<html><head><meta charset="utf-8"><title>${escapeHtml(draftTitle)}</title><style>@page{size:${pageDimensions.widthMm}mm ${pageDimensions.heightMm}mm;margin:${pageSettings.margins.top}cm ${pageSettings.margins.right}cm ${pageSettings.margins.bottom}cm ${pageSettings.margins.left}cm}body{font:11pt Arial,sans-serif;line-height:1.5;background:${pageSettings.pageColor};color:#202124}table{width:100%;border-collapse:collapse}td,th{border:1px solid #999;padding:6px}.export-header,.export-footer{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;color:#5f6368;font-size:9pt}.export-header{margin-bottom:20px;border-bottom:1px solid #eee;padding-bottom:8px}.export-footer{margin-top:20px;border-top:1px solid #eee;padding-top:8px}.docs-page-break{page-break-after:always}</style></head><body>${headerVisible ? exportBand('header') : ''}${content}${footerVisible ? exportBand('footer') : ''}</body></html>`
  }

  function downloadDocument() {
    const content = currentDocumentHtml()
    downloadFile(exportShell(content), 'application/msword', 'doc')
  }

  function downloadFile(content: string, type: string, extension: string) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `${draftTitle.replace(/[^a-z0-9áéíóúñ _-]/gi, '_') || 'documento'}.${extension}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function downloadHtml() {
    const content = currentDocumentHtml()
    downloadFile(`<!doctype html>${exportShell(content)}`, 'text/html;charset=utf-8', 'html')
  }

  function downloadText() {
    downloadFile(plainText(currentDocumentHtml()), 'text/plain;charset=utf-8', 'txt')
  }

  async function shareDocument() {
    const shareData = { title: draftTitle, text: `Documento “${draftTitle}” en Vertex`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(window.location.href)
        window.alert('Enlace copiado al portapapeles.')
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') window.alert('No se pudo compartir el documento.')
    }
  }

  if (!selectedDoc) {
    return (
      <div className="vertex-docs-home -m-8 min-h-screen bg-[#07070a] text-[#f1f5f9]">
        <header className="vertex-docs-library-header sticky top-0 z-20 flex h-16 items-center gap-5 border-b border-[#1e1e28] bg-[#0e0e13] px-6">
          <div className="flex min-w-fit items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#e56517]/30 bg-[#e56517]/10"><FileText size={19} className="text-[#e56517]" /></span>
            <span className="font-display text-[18px] font-semibold text-[#f1f5f9]">Vertex Docs</span>
          </div>
          <label className="vertex-docs-search mx-auto flex h-11 w-full max-w-2xl items-center gap-3 rounded-md border border-[#1e1e28] bg-[#141419] px-4 focus-within:border-[#e56517]/60">
            <Search size={18} className="text-[#8b95a7]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-base outline-none" placeholder="Buscar en Documentos" />
          </label>
        </header>

        <section className="vertex-docs-templates border-b border-[#1e1e28] bg-[#0e0e13] px-6 py-7">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="font-sans text-base font-medium tracking-normal">Crear un documento</h1>
              <span className="text-sm text-[#5f6368]">Galería de plantillas</span>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {templates.map((template) => (
                <button key={template.name} disabled={busy} onClick={() => createDocument(template)} className="group text-left disabled:opacity-50">
                  <div className="relative aspect-[1/1.28] overflow-hidden rounded-md border border-[#292933] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,.24)] transition group-hover:-translate-y-1 group-hover:border-[#e56517]" style={{ backgroundColor: template.color }}>
                    {template.name === 'En blanco' ? (
                      <Plus size={44} strokeWidth={1.5} className="absolute inset-0 m-auto text-[#e56517]" />
                    ) : (
                      <div className="space-y-2 opacity-80">
                        <div className="h-3 w-3/4 rounded-sm" style={{ backgroundColor: template.accent }} />
                        <div className="h-1.5 w-full bg-[#bdc1c6]" /><div className="h-1.5 w-5/6 bg-[#dadce0]" />
                        <div className="pt-3"><div className="mb-2 h-2 w-1/2 bg-[#9aa0a6]" /><div className="h-1.5 w-full bg-[#dadce0]" /><div className="mt-2 h-1.5 w-4/5 bg-[#dadce0]" /></div>
                      </div>
                    )}
                  </div>
                  <span className="mt-2 block text-sm font-medium">{template.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-sans text-base font-medium tracking-normal">Documentos recientes</h2>
            <div className="flex items-center gap-1 rounded-full border border-[#dadce0] p-1">
              <button aria-label="Vista de cuadrícula" onClick={() => setView('grid')} className={`rounded p-2 ${view === 'grid' ? 'bg-[#e56517]/15 text-[#e56517]' : 'text-[#8b95a7]'}`}><Grid3X3 size={17} /></button>
              <button aria-label="Vista de lista" onClick={() => setView('list')} className={`rounded p-2 ${view === 'list' ? 'bg-[#e56517]/15 text-[#e56517]' : 'text-[#8b95a7]'}`}><List size={17} /></button>
            </div>
          </div>

          {!filteredDocuments.length ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-[#dadce0] py-16 text-center">
              <FileText size={48} className="mb-3 text-[#9aa0a6]" />
              <p className="font-medium">Aún no tienes documentos</p>
              <p className="mt-1 text-sm text-[#5f6368]">Selecciona una plantilla para comenzar.</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {filteredDocuments.map((doc) => <DocumentCard key={doc.id} doc={doc} onOpen={() => openDocument(doc)} onDelete={() => deleteDocument(doc)} />)}
            </div>
          ) : (
            <div className="vertex-docs-list overflow-hidden rounded-lg border border-[#1e1e28] bg-[#0e0e13]">
              {filteredDocuments.map((doc) => (
                <button key={doc.id} onClick={() => openDocument(doc)} className="flex w-full items-center gap-4 border-b border-[#e8eaed] px-5 py-3 text-left last:border-0 hover:bg-[#f8f9fa]">
                  <FileText size={20} className="fill-[#4285f4] text-[#4285f4]" /><span className="flex-1 truncate text-sm font-medium">{doc.title}</span>
                  <span className="hidden text-xs text-[#5f6368] sm:block">{formatDate(doc.updatedAt)}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className={`vertex-docs-shell ${fullscreen ? 'fixed inset-0 z-[100] h-screen' : '-m-8 h-screen'} relative flex min-h-0 flex-col overflow-hidden bg-[#07070a] text-[#f1f5f9]`}>
      <header className="vertex-docs-header z-30 shrink-0 border-b border-[#1e1e28] bg-[#0e0e13] px-3 pt-2 shadow-[0_8px_30px_rgba(0,0,0,.2)]">
        <div className="flex items-center gap-2">
          <button onClick={closeDocument} title="Volver a documentos" className="rounded-md p-2 text-[#8b95a7] hover:bg-[#1a1a21] hover:text-[#f1f5f9]"><ArrowLeft size={20} /></button>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#e56517]/30 bg-[#e56517]/10"><FileText size={18} className="text-[#e56517]" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <input
                value={draftTitle}
                onChange={(event) => { setDraftTitle(event.target.value); markEdited() }}
                className="min-w-0 max-w-lg flex-1 rounded bg-transparent px-2 font-display text-[16px] font-semibold leading-7 text-[#f1f5f9] outline-none hover:bg-[#141419] focus:bg-[#141419] focus:ring-1 focus:ring-[#e56517]/60"
                aria-label="Nombre del documento"
              />
              <button onClick={() => { setDraftCategory(draftCategory === 'Destacado' ? 'General' : 'Destacado'); markEdited() }} title={draftCategory === 'Destacado' ? 'Quitar de destacados' : 'Destacar'} className={`rounded-md p-1.5 hover:bg-[#1c1c24] ${draftCategory === 'Destacado' ? 'text-[#f59e0b]' : 'text-[#687285]'}`}><Star size={17} fill={draftCategory === 'Destacado' ? 'currentColor' : 'none'} /></button>
              <SaveIndicator state={saveState} />
            </div>
            <div className="vertex-docs-menu-row relative flex h-7 items-center gap-0.5 text-[12px] text-[#a8b0bf]">
              {(['file', 'edit', 'view', 'insert', 'format', 'tools', 'help'] as MenuName[]).map((name) => (
                <MenuButton key={name} label={{ file: 'Archivo', edit: 'Editar', view: 'Ver', insert: 'Insertar', format: 'Formato', tools: 'Herramientas', help: 'Ayuda' }[name]} active={menu === name} onClick={() => setMenu(menu === name ? null : name)} />
              ))}
              {menu && <EditorMenu menu={menu} onClose={() => setMenu(null)} actions={{
                create: () => createDocument(), save: () => void saveNow(), duplicate: duplicateDocument, download: downloadDocument, downloadHtml, downloadText, print: printDocument, pageSetup: () => setPageSetupOpen(true), remove: () => deleteDocument(),
                undo: () => run('undo'), redo: () => run('redo'), cut: () => run('cut'), copy: () => run('copy'), paste: async () => { try { insertHtml(escapeHtml(await navigator.clipboard.readText()).replace(/\n/g, '<br>')) } catch { window.alert('El navegador no permitió leer el portapapeles.') } }, selectAll: () => run('selectAll'), find: () => setFindOpen(true),
                ruler: () => setShowRuler((value) => !value), status: () => setShowStatus((value) => !value), fullscreen: () => setFullscreen((value) => !value), zoomIn: () => updateZoom(zoom + 10), zoomOut: () => updateZoom(zoom - 10),
                link: insertLink, unlink: () => run('unlink'), image: () => imageInputRef.current?.click(), table: insertTable, line: () => insertHtml('<hr><p><br></p>'), date: () => insertHtml(escapeHtml(new Intl.DateTimeFormat('es', { dateStyle: 'long', timeStyle: 'short' }).format(new Date()))), symbol: insertSpecialCharacter, pageBreak: () => insertHtml('<div class="docs-page-break"><br></div><p><br></p>'),
                bold: () => run('bold'), italic: () => run('italic'), underline: () => run('underline'), strike: () => run('strikeThrough'), superscript: () => run('superscript'), subscript: () => run('subscript'), clear: () => run('removeFormat'), normal: () => { run('formatBlock', 'p'); setBlockType('p') }, quote: () => { run('formatBlock', 'blockquote'); setBlockType('blockquote') }, upper: () => transformSelection((value) => value.toLocaleUpperCase('es')), lower: () => transformSelection((value) => value.toLocaleLowerCase('es')),
                count: () => setWordCountOpen(true), spelling: () => setSpellCheck((value) => !value), pageColor: () => window.document.getElementById('docs-page-color')?.click(), help: () => window.alert('Atajos: Ctrl+S guardar · Ctrl+F buscar · Ctrl+Z deshacer · Ctrl+Y rehacer · Ctrl+B negrita · Ctrl+I cursiva · Ctrl+U subrayado.'), about: () => window.alert('Vertex Documentos — editor académico con guardado automático y herramientas de IA.'),
              }} />}
            </div>
          </div>
          <button onClick={() => setAcademicPanelOpen((open) => !open)} className={`hidden items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition sm:flex ${academicPanelOpen ? 'bg-[#fce8d5] text-[#a4480b]' : 'bg-[#fff7ed] text-[#c4550d] hover:bg-[#fce8d5]'}`}><Sparkles size={17} /> Vertex IA</button>
          <button onClick={() => void shareDocument()} className="hidden items-center gap-2 rounded-md bg-[#e56517] px-4 py-2 text-xs font-semibold text-white hover:bg-[#cc5813] md:flex"><Share2 size={15} /> Compartir</button>
        </div>

        <div className="vertex-docs-toolbar mt-2 flex h-11 items-center gap-1 overflow-x-auto rounded-t-md border border-b-0 border-[#292933] bg-[#141419] px-2 text-[#cbd2dd]">
          <ToolButton title="Deshacer" onClick={() => run('undo')}><Undo2 size={17} /></ToolButton>
          <ToolButton title="Rehacer" onClick={() => run('redo')}><Redo2 size={17} /></ToolButton>
          <ToolButton title="Imprimir" onClick={printDocument}><Printer size={17} /></ToolButton>
          <ToolButton title="Configurar página" onClick={() => setPageSetupOpen(true)}><FileCog size={17} /></ToolButton>
          <Divider />
          <ToolButton title="Alejar" onClick={() => updateZoom(zoom - 10)}><Minus size={16} /></ToolButton>
          <label className="flex h-8 w-[58px] items-center rounded bg-transparent px-1 text-xs hover:bg-[#dfe5ef]" title="Zoom"><input type="number" min="25" max="250" value={zoom} onChange={(event) => updateZoom(Number(event.target.value))} className="w-9 bg-transparent text-right outline-none" aria-label="Porcentaje de zoom" /><span>%</span></label>
          <ToolButton title="Acercar" onClick={() => updateZoom(zoom + 10)}><Plus size={16} /></ToolButton>
          <select defaultValue="" onChange={(event) => { if (event.target.value === 'width') fitZoom('width'); if (event.target.value === 'page') fitZoom('page'); event.target.value = '' }} className="h-8 w-24 rounded bg-transparent px-1 text-xs outline-none hover:bg-[#dfe5ef]" aria-label="Ajustar zoom">
            <option value="" disabled>Ajustar</option><option value="width">Al ancho</option><option value="page">Página completa</option>
          </select>
          <Divider />
          <select value={blockType} onChange={(event) => { setBlockType(event.target.value); run('formatBlock', event.target.value) }} className="h-8 w-32 rounded bg-transparent px-2 text-xs outline-none hover:bg-[#dfe5ef]" aria-label="Estilo de párrafo">
            <option value="p">Texto normal</option><option value="h1">Título</option><option value="h2">Encabezado 1</option><option value="h3">Encabezado 2</option><option value="h4">Encabezado 3</option><option value="blockquote">Cita</option><option value="pre">Código</option>
          </select>
          <Divider />
          <select value={fontFamily} onChange={(event) => { setFontFamily(event.target.value); run('fontName', event.target.value) }} className="h-8 w-32 rounded bg-transparent px-2 text-xs outline-none hover:bg-[#dfe5ef]" aria-label="Tipo de letra">
            {fontFamilies.map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
          <Divider />
          <select value={fontSize} onChange={(event) => setTextSize(Number(event.target.value))} className="h-8 w-16 rounded bg-transparent px-1 text-xs outline-none hover:bg-[#dfe5ef]" aria-label="Tamaño de letra">
            {fontSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <Divider />
          <ToolButton title="Negrita" onClick={() => run('bold')}><Bold size={17} /></ToolButton>
          <ToolButton title="Cursiva" onClick={() => run('italic')}><Italic size={17} /></ToolButton>
          <ToolButton title="Subrayado" onClick={() => run('underline')}><Underline size={17} /></ToolButton>
          <ToolButton title="Tachado" onClick={() => run('strikeThrough')}><Strikethrough size={17} /></ToolButton>
          <label title="Color del texto" className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-[#dfe5ef]"><PaintBucket size={17} /><input type="color" onChange={(event) => run('foreColor', event.target.value)} className="absolute inset-0 opacity-0" /></label>
          <label title="Color de resaltado" className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded font-bold hover:bg-[#dfe5ef]">A<input type="color" defaultValue="#fff59d" onChange={(event) => run('hiliteColor', event.target.value)} className="absolute inset-0 opacity-0" /></label>
          <Divider />
          <ToolButton title="Alinear a la izquierda" onClick={() => run('justifyLeft')}><AlignLeft size={17} /></ToolButton>
          <ToolButton title="Centrar" onClick={() => run('justifyCenter')}><AlignCenter size={17} /></ToolButton>
          <ToolButton title="Alinear a la derecha" onClick={() => run('justifyRight')}><AlignRight size={17} /></ToolButton>
          <ToolButton title="Justificar" onClick={() => run('justifyFull')}><AlignJustify size={17} /></ToolButton>
          <ToolButton title="Lista con viñetas" onClick={() => run('insertUnorderedList')}><List size={17} /></ToolButton>
          <ToolButton title="Lista numerada" onClick={() => run('insertOrderedList')}><ListOrdered size={17} /></ToolButton>
          <ToolButton title="Reducir sangría" onClick={() => run('outdent')}><IndentDecrease size={17} /></ToolButton>
          <ToolButton title="Aumentar sangría" onClick={() => run('indent')}><IndentIncrease size={17} /></ToolButton>
          <select value={lineHeight} onChange={(event) => setParagraphSpacing(event.target.value)} className="h-8 w-24 rounded bg-transparent px-1 text-xs outline-none hover:bg-[#dfe5ef]" aria-label="Interlineado" title="Interlineado">
            <option value="1">Sencillo</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">Doble</option><option value="2.5">2.5</option><option value="3">Triple</option>
          </select>
          <ToolButton title="Insertar enlace" onClick={insertLink}><Link2 size={17} /></ToolButton>
          <ToolButton title="Insertar imagen" onClick={() => imageInputRef.current?.click()}><ImageIcon size={17} /></ToolButton>
          <ToolButton title="Borrar formato" onClick={() => run('removeFormat')}><RemoveFormatting size={17} /></ToolButton>
          <Divider />
          <button onClick={() => setAcademicPanelOpen((open) => !open)} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${academicPanelOpen ? 'bg-[#f6c28b] text-[#7c3708]' : 'bg-[#fff7ed] text-[#c4550d] hover:bg-[#fce8d5]'}`}><Sparkles size={14} /> Resolver con Vertex</button>
        </div>
      </header>

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { insertImage(event.target.files?.[0]); event.target.value = '' }} />
      <input id="docs-page-color" type="color" value={pageSettings.pageColor} className="hidden" onChange={(event) => updatePageSettings({ pageColor: event.target.value })} />

      {showRuler && <div className="vertex-docs-ruler z-10 flex h-7 shrink-0 items-end justify-center border-b border-[#292933] bg-[#0e0e13] text-[9px] text-[#677184] shadow-sm">
        <div className="relative h-full max-w-[calc(100%-2rem)] bg-[repeating-linear-gradient(90deg,transparent_0,transparent_47px,#dadce0_48px)]" style={{ width: pageDimensions.width }}>
          <span className="absolute bottom-1 left-2">0</span><span className="absolute bottom-1 left-1/4">5</span><span className="absolute bottom-1 left-1/2">10</span><span className="absolute bottom-1 left-3/4">15</span>
        </div>
      </div>}

      <div className="flex min-h-0 flex-1">
        <main ref={canvasViewportRef} onWheel={(event) => { if (event.ctrlKey) { event.preventDefault(); updateZoom(zoom + (event.deltaY < 0 ? 10 : -10)) } }} className="vertex-docs-canvas flex min-h-0 flex-1 justify-center overflow-auto bg-[#09090d] px-4 py-6 sm:px-8 sm:py-8">
          <div className="origin-top space-y-6 transition-transform" style={{ width: pageDimensions.width, transform: `scale(${zoom / 100})`, marginBottom: `${Math.max(0, (zoom / 100 - 1) * (pageCount * pageDimensions.height + (pageCount - 1) * 24))}px` }}>
            {pages.map((_, pageIndex) => {
              const horizontalPadding = Math.max(20, pageSettings.margins.left * 96 / 2.54)
              const marginTop = pageSettings.margins.top * 96 / 2.54
              const marginBottom = pageSettings.margins.bottom * 96 / 2.54
              const editingPage = headerFooterEditing?.pageIndex === pageIndex
              return <section key={pageIndex} className="vertex-docs-page relative overflow-hidden border border-[#2a2a33] bg-white shadow-[0_18px_55px_rgba(0,0,0,.42)]" style={{ width: pageDimensions.width, height: pageDimensions.height, backgroundColor: pageSettings.pageColor }} aria-label={`Página ${pageIndex + 1}`}>
                <div
                  ref={(node) => { pageRefs.current[pageIndex] = node }}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={(event) => { editorRef.current = event.currentTarget; setActivePageIndex(pageIndex); setHeaderFooterEditing(null); captureEditorSelection() }}
                  onInput={syncEditor}
                  onBlur={syncEditor}
                  onMouseUp={captureEditorSelection}
                  onKeyUp={(event) => {
                    captureEditorSelection()
                    if (event.key === heldEditingKeyRef.current) {
                      heldEditingKeyRef.current = null
                      schedulePagination()
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === 'Backspace') heldEditingKeyRef.current = event.key
                    if (event.key === 'Tab') {
                      event.preventDefault()
                      run(event.shiftKey ? 'outdent' : 'indent')
                    }
                    if (event.key === 'Backspace' && pageIndex > 0) {
                      if (caretIsAtPageStart(event.currentTarget)) {
                        event.preventDefault()
                        deleteAcrossPageBoundary(pageIndex)
                      }
                    }
                  }}
                  className="docs-editor docs-page-content absolute inset-0 z-10 box-border overflow-hidden text-[11pt] leading-[1.55] text-[#202124] outline-none"
                  style={{ paddingTop: `${pageSettings.margins.top * 96 / 2.54}px`, paddingRight: `${pageSettings.margins.right * 96 / 2.54}px`, paddingBottom: `${pageSettings.margins.bottom * 96 / 2.54}px`, paddingLeft: `${pageSettings.margins.left * 96 / 2.54}px` }}
                  spellCheck={spellCheck}
                  aria-label={`Contenido de la página ${pageIndex + 1}`}
                />
                {!editingPage && <>
                  <button type="button" onDoubleClick={() => openHeaderFooter(pageIndex, 'header')} className="absolute inset-x-0 top-0 z-30 cursor-text bg-transparent" style={{ height: Math.max(38, marginTop) }} title="Haz doble clic para editar el encabezado" aria-label={`Editar encabezado de la página ${pageIndex + 1}`} />
                  <button type="button" onDoubleClick={() => openHeaderFooter(pageIndex, 'footer')} className="absolute inset-x-0 bottom-0 z-30 cursor-text bg-transparent" style={{ height: Math.max(38, marginBottom) }} title="Haz doble clic para editar el pie de página" aria-label={`Editar pie de página de la página ${pageIndex + 1}`} />
                </>}
                <div className="pointer-events-none absolute inset-0 z-20 text-[10px] text-[#80868b]" aria-hidden>
                  <div className="absolute grid grid-cols-3 gap-3" style={{ top: Math.max(12, pageSettings.margins.top * 96 / 5.08), left: horizontalPadding, right: Math.max(20, pageSettings.margins.right * 96 / 2.54) }}>
                    {!editingPage && <><span className="truncate text-left">{runningItems('header', 'left', pageIndex)}</span><span className="truncate text-center">{runningItems('header', 'center', pageIndex)}</span><span className="truncate text-right">{runningItems('header', 'right', pageIndex)}</span></>}
                  </div>
                  <div className="absolute grid grid-cols-3 gap-3" style={{ bottom: Math.max(12, pageSettings.margins.bottom * 96 / 5.08), left: horizontalPadding, right: Math.max(20, pageSettings.margins.right * 96 / 2.54) }}>
                    {!editingPage && <><span className="truncate text-left">{runningItems('footer', 'left', pageIndex)}</span><span className="truncate text-center">{runningItems('footer', 'center', pageIndex)}</span><span className="truncate text-right">{runningItems('footer', 'right', pageIndex)}</span></>}
                  </div>
                </div>
                {editingPage && <div className="pointer-events-none absolute inset-0 z-40 text-xs text-[#3c4043]">
                  <textarea autoFocus={headerFooterEditing.section === 'header'} value={directRunningText('header', pageIndex)} onChange={(event) => updateDirectRunningText('header', pageIndex, event.target.value)} onFocus={() => setHeaderFooterEditing({ pageIndex, section: 'header' })} onKeyDown={(event) => { if (event.key === 'Escape') setHeaderFooterEditing(null) }} placeholder={pageIndex === 0 && pageSettings.differentFirstPage ? 'Encabezado de la primera página' : 'Escribe el encabezado'} className="pointer-events-auto absolute z-10 resize-none overflow-hidden border-0 bg-transparent px-0 py-1 text-[11px] leading-4 outline-none" style={{ top: Math.max(10, marginTop / 3), left: horizontalPadding, right: Math.max(20, pageSettings.margins.right * 96 / 2.54), height: Math.max(24, marginTop / 3), textAlign: pageSettings.headerAlign }} />
                  <HeaderFooterBar label="Encabezado" style={{ top: Math.max(42, marginTop - 31) }} differentFirstPage={pageSettings.differentFirstPage} onDifferentFirstPage={(checked) => updatePageSettings({ differentFirstPage: checked, hideNumberOnFirstPage: checked || pageSettings.hideNumberOnFirstPage })} onOptions={() => setPageSetupOpen(true)} onClose={() => setHeaderFooterEditing(null)} />
                  <textarea autoFocus={headerFooterEditing.section === 'footer'} value={directRunningText('footer', pageIndex)} onChange={(event) => updateDirectRunningText('footer', pageIndex, event.target.value)} onFocus={() => setHeaderFooterEditing({ pageIndex, section: 'footer' })} onKeyDown={(event) => { if (event.key === 'Escape') setHeaderFooterEditing(null) }} placeholder={pageIndex === 0 && pageSettings.differentFirstPage ? 'Pie de la primera página' : 'Escribe el pie de página'} className="pointer-events-auto absolute z-10 resize-none overflow-hidden border-0 bg-transparent px-0 py-1 text-[11px] leading-4 outline-none" style={{ bottom: Math.max(10, marginBottom / 3), left: horizontalPadding, right: Math.max(20, pageSettings.margins.right * 96 / 2.54), height: Math.max(24, marginBottom / 3), textAlign: pageSettings.footerAlign }} />
                  <HeaderFooterBar label="Pie de página" style={{ bottom: Math.max(42, marginBottom - 31) }} differentFirstPage={pageSettings.differentFirstPage} onDifferentFirstPage={(checked) => updatePageSettings({ differentFirstPage: checked, hideNumberOnFirstPage: checked || pageSettings.hideNumberOnFirstPage })} onOptions={() => setPageSetupOpen(true)} onClose={() => setHeaderFooterEditing(null)} />
                </div>}
              </section>
            })}
          </div>
        </main>
        {academicPanelOpen && (
          <AcademicPanel
            selectedText={selectedText}
            documentText={plainText(draftContent)}
            onInsertHtml={(html) => insertAcademicHtml(html)}
            onReplaceSelection={(html) => insertAcademicHtml(html, true)}
            onClose={() => setAcademicPanelOpen(false)}
          />
        )}
      </div>

      {showStatus && <footer className="vertex-docs-status absolute bottom-3 left-4 z-30 rounded-md border border-[#292933] bg-[#141419] px-3 py-1 font-mono text-[10px] text-[#8b95a7] shadow-lg">
        Página {Math.min(activePageIndex + 1, pageCount)} de {pageCount} · {words.length} palabras · {plainText(draftContent).length} caracteres
      </footer>}
      <div className={`vertex-docs-zoom absolute bottom-3 z-30 flex h-8 items-center gap-1 rounded-md border border-[#292933] bg-[#141419] px-2 text-[#8b95a7] shadow-lg transition-all ${academicPanelOpen ? 'right-[386px]' : 'right-4'}`}>
        <button onClick={() => updateZoom(zoom - 10)} title="Alejar" className="grid h-6 w-6 place-items-center rounded-full hover:bg-[#f1f3f4]"><Minus size={14} /></button>
        <input type="range" min="25" max="250" step="5" value={zoom} onChange={(event) => updateZoom(Number(event.target.value))} className="h-1 w-24 cursor-pointer accent-[#0b57d0]" aria-label="Zoom del documento" />
        <button onClick={() => updateZoom(zoom + 10)} title="Acercar" className="grid h-6 w-6 place-items-center rounded-full hover:bg-[#f1f3f4]"><Plus size={14} /></button>
        <button onClick={() => fitZoom('page')} title="Ajustar página" className="min-w-12 rounded px-1 py-1 text-[11px] font-medium hover:bg-[#f1f3f4]">{zoom}%</button>
      </div>

      {wordCountOpen && (
        <Modal title="Recuento de palabras" onClose={() => setWordCountOpen(false)}>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm"><span>Páginas</span><span>{pageCount}</span><span>Palabras</span><span>{words.length}</span><span>Caracteres</span><span>{plainText(draftContent).length}</span><span>Caracteres sin espacios</span><span>{plainText(draftContent).replace(/\s/g, '').length}</span></div>
        </Modal>
      )}
      {findOpen && (
        <Modal title="Buscar y reemplazar" onClose={() => setFindOpen(false)}>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-[#5f6368]">Buscar<input autoFocus value={findText} onChange={(event) => setFindText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') findNext() }} className="mt-1.5 w-full rounded-md border border-[#dadce0] px-3 py-2 text-sm outline-none focus:border-[#4285f4]" /></label>
            <label className="block text-xs font-medium text-[#5f6368]">Reemplazar por<input value={replaceText} onChange={(event) => setReplaceText(event.target.value)} className="mt-1.5 w-full rounded-md border border-[#dadce0] px-3 py-2 text-sm outline-none focus:border-[#4285f4]" /></label>
            <div className="flex justify-end gap-2 pt-2"><button onClick={findNext} className="rounded-full border border-[#dadce0] px-4 py-2 text-sm font-medium hover:bg-[#f8f9fa]">Buscar</button><button onClick={replaceAll} className="rounded-full bg-[#0b57d0] px-4 py-2 text-sm font-medium text-white hover:bg-[#0842a0]">Reemplazar todo</button></div>
          </div>
        </Modal>
      )}
      {pageSetupOpen && <PageSetupModal settings={pageSettings} onChange={updatePageSettings} onClose={() => setPageSetupOpen(false)} />}
    </div>
  )
}

function DocumentCard({ doc, onOpen, onDelete }: { doc: DocumentItem; onOpen: () => void; onDelete: () => void }) {
  return (
    <article className="vertex-doc-card group overflow-hidden rounded-lg border border-[#1e1e28] bg-[#0e0e13] hover:border-[#e56517]/60 hover:shadow-[0_14px_35px_rgba(0,0,0,.35)]">
      <button onClick={onOpen} className="block aspect-[1/1.22] w-full overflow-hidden border-b border-[#e8eaed] bg-white p-5 text-left">
        <div className="docs-thumbnail origin-top scale-[.42] text-[#5f6368]" dangerouslySetInnerHTML={{ __html: doc.content }} />
      </button>
      <div className="flex items-center gap-3 p-3">
        <FileText size={20} className="shrink-0 fill-[#4285f4] text-[#4285f4]" />
        <button onClick={onOpen} className="min-w-0 flex-1 text-left"><div className="truncate text-sm font-medium">{doc.title}</div><div className="mt-1 flex items-center gap-1 text-[11px] text-[#5f6368]"><Clock3 size={11} /> {formatDate(doc.updatedAt)}</div></button>
        <button onClick={onDelete} title="Eliminar" className="rounded-full p-2 text-[#5f6368] opacity-0 hover:bg-[#f1f3f4] group-hover:opacity-100"><MoreVertical size={17} /></button>
      </div>
    </article>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recientemente'
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }).format(date)
}

function SaveIndicator({ state }: { state: SaveState }) {
  const config = state === 'saving'
    ? { icon: Cloud, text: 'Guardando…', color: 'text-[#5f6368]' }
    : state === 'error'
      ? { icon: CloudOff, text: 'Error al guardar', color: 'text-[#d93025]' }
      : { icon: Check, text: 'Guardado en la nube', color: 'text-[#5f6368]' }
  const Icon = config.icon
  return <span title={config.text} className={`ml-1 flex items-center gap-1 text-[11px] ${config.color}`}><Icon size={16} /><span className="hidden lg:inline">{config.text}</span></span>
}

function MenuButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded px-2 py-1 transition hover:bg-[#1c1c24] hover:text-white ${active ? 'bg-[#e56517]/15 text-[#f28a4a]' : ''}`}>{label}</button>
}

function EditorMenu({ menu, onClose, actions }: { menu: MenuName; onClose: () => void; actions: Record<string, () => void> }) {
  const menuLeft: Record<MenuName, number> = { file: 0, edit: 58, view: 110, insert: 150, format: 210, tools: 275, help: 365 }
  const groups: Record<MenuName, Array<{ icon: typeof FileText; label: string; action: () => void; shortcut?: string; danger?: boolean }>> = {
    file: [
      { icon: Plus, label: 'Nuevo documento', action: actions.create },
      { icon: Save, label: 'Guardar ahora', action: actions.save, shortcut: 'Ctrl+S' },
      { icon: FileCog, label: 'Configuración de página', action: actions.pageSetup },
      { icon: Copy, label: 'Hacer una copia', action: actions.duplicate },
      { icon: Download, label: 'Descargar como Word (.doc)', action: actions.download },
      { icon: Download, label: 'Descargar como HTML', action: actions.downloadHtml },
      { icon: Download, label: 'Descargar como texto (.txt)', action: actions.downloadText },
      { icon: Printer, label: 'Imprimir', action: actions.print, shortcut: 'Ctrl+P' },
      { icon: Trash2, label: 'Mover a la papelera', action: actions.remove, danger: true },
    ],
    edit: [
      { icon: Undo2, label: 'Deshacer', action: actions.undo, shortcut: 'Ctrl+Z' },
      { icon: Redo2, label: 'Rehacer', action: actions.redo, shortcut: 'Ctrl+Y' },
      { icon: Eraser, label: 'Cortar', action: actions.cut, shortcut: 'Ctrl+X' },
      { icon: Copy, label: 'Copiar', action: actions.copy, shortcut: 'Ctrl+C' },
      { icon: Pilcrow, label: 'Pegar como texto', action: actions.paste, shortcut: 'Ctrl+V' },
      { icon: Search, label: 'Buscar y reemplazar', action: actions.find, shortcut: 'Ctrl+F' },
      { icon: Maximize, label: 'Seleccionar todo', action: actions.selectAll, shortcut: 'Ctrl+A' },
    ],
    view: [
      { icon: Eye, label: 'Mostrar u ocultar regla', action: actions.ruler },
      { icon: FileText, label: 'Mostrar u ocultar recuento', action: actions.status },
      { icon: Plus, label: 'Aumentar zoom', action: actions.zoomIn },
      { icon: Minus, label: 'Reducir zoom', action: actions.zoomOut },
      { icon: Maximize, label: 'Pantalla completa', action: actions.fullscreen },
    ],
    insert: [
      { icon: FileCog, label: 'Encabezado, pie y números de página', action: actions.pageSetup },
      { icon: ImageIcon, label: 'Imagen', action: actions.image },
      { icon: Table, label: 'Tabla', action: actions.table },
      { icon: Link2, label: 'Enlace', action: actions.link },
      { icon: Unlink, label: 'Quitar enlace', action: actions.unlink },
      { icon: Minus, label: 'Línea horizontal', action: actions.line },
      { icon: CalendarDays, label: 'Fecha y hora', action: actions.date },
      { icon: FileText, label: 'Salto de página', action: actions.pageBreak },
      { icon: Pilcrow, label: 'Carácter especial', action: actions.symbol },
    ],
    format: [
      { icon: Bold, label: 'Negrita', action: actions.bold, shortcut: 'Ctrl+B' },
      { icon: Italic, label: 'Cursiva', action: actions.italic, shortcut: 'Ctrl+I' },
      { icon: Underline, label: 'Subrayado', action: actions.underline, shortcut: 'Ctrl+U' },
      { icon: Strikethrough, label: 'Tachado', action: actions.strike },
      { icon: Superscript, label: 'Superíndice', action: actions.superscript },
      { icon: Subscript, label: 'Subíndice', action: actions.subscript },
      { icon: Pilcrow, label: 'Texto normal', action: actions.normal },
      { icon: Quote, label: 'Cita en bloque', action: actions.quote },
      { icon: CaseUpper, label: 'MAYÚSCULAS', action: actions.upper },
      { icon: CaseLower, label: 'minúsculas', action: actions.lower },
      { icon: RemoveFormatting, label: 'Borrar formato', action: actions.clear },
    ],
    tools: [
      { icon: FileText, label: 'Recuento de palabras', action: actions.count },
      { icon: Check, label: 'Activar o desactivar ortografía', action: actions.spelling },
      { icon: PaintBucket, label: 'Color de página', action: actions.pageColor },
    ],
    help: [
      { icon: HelpCircle, label: 'Atajos de teclado', action: actions.help },
      { icon: Sparkles, label: 'Acerca de Vertex Documentos', action: actions.about },
    ],
  }
  const items = groups[menu]
  return (
    <div style={{ left: menuLeft[menu] }} className="absolute top-7 z-50 max-h-[70vh] min-w-72 overflow-y-auto rounded-md border border-[#292933] bg-[#141419] py-2 text-[#d9dee7] shadow-[0_18px_45px_rgba(0,0,0,.5)]">
      {items.map(({ icon: Icon, label, action, shortcut, danger }) => <button key={label} onMouseDown={(event) => event.preventDefault()} onClick={() => { action(); onClose() }} className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-[#1e1e27] ${danger ? 'text-[#f87171]' : ''}`}><Icon size={16} className={danger ? 'text-[#f87171]' : 'text-[#e56517]'} /><span className="flex-1">{label}</span>{shortcut && <span className="font-mono text-[10px] text-[#687285]">{shortcut}</span>}</button>)}
    </div>
  )
}

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return <button title={title} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#aab3c1] transition hover:bg-[#25252e] hover:text-[#f28a4a]">{children}</button>
}

function Divider() { return <span className="mx-1 h-5 w-px shrink-0 bg-[#30303a]" /> }

function HeaderFooterBar({ label, style, differentFirstPage, onDifferentFirstPage, onOptions, onClose }: { label: string; style: React.CSSProperties; differentFirstPage: boolean; onDifferentFirstPage: (checked: boolean) => void; onOptions: () => void; onClose: () => void }) {
  return <div className="pointer-events-auto absolute inset-x-0 z-20 flex h-8 items-center gap-4 border-y border-[#e56517]/40 bg-[#fff8f3] px-3 text-[#3c4043]" style={style}>
    <span className="mr-auto font-medium">{label}</span>
    <label className="flex items-center gap-2 whitespace-nowrap text-[11px]"><input type="checkbox" checked={differentFirstPage} onChange={(event) => onDifferentFirstPage(event.target.checked)} className="h-3.5 w-3.5 accent-[#0b57d0]" />Primera página diferente</label>
    <button type="button" onClick={onOptions} className="font-medium text-[#0b57d0] hover:underline">Opciones</button>
    <button type="button" onClick={onClose} className="rounded px-2 py-1 text-[#5f6368] hover:bg-[#e8eaed]">Cerrar</button>
  </div>
}

function PageSetupModal({ settings, onChange, onClose }: { settings: PageSettings; onChange: (patch: Partial<PageSettings>) => void; onClose: () => void }) {
  const setMargin = (side: keyof PageSettings['margins'], value: number) => onChange({ margins: { ...settings.margins, [side]: Math.min(10, Math.max(0, value || 0)) } })
  const alignmentOptions = <><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></>
  return (
    <Modal title="Configuración de página" onClose={onClose} wide>
      <div className="max-h-[72vh] space-y-6 overflow-y-auto pr-2 text-sm">
        <section>
          <h3 className="mb-3 font-semibold">Papel y orientación</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[#5f6368]">Tamaño de hoja<select value={settings.paperSize} onChange={(event) => onChange({ paperSize: event.target.value as PaperSize })} className="mt-1.5 w-full rounded-md border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#202124] outline-none focus:border-[#4285f4]">{Object.entries(paperSizes).map(([value, paper]) => <option key={value} value={value}>{paper.label}</option>)}</select></label>
            <div><span className="text-xs font-medium text-[#5f6368]">Orientación</span><div className="mt-1.5 grid grid-cols-2 gap-2"><ChoiceButton active={settings.orientation === 'portrait'} onClick={() => onChange({ orientation: 'portrait' })}>Vertical</ChoiceButton><ChoiceButton active={settings.orientation === 'landscape'} onClick={() => onChange({ orientation: 'landscape' })}>Horizontal</ChoiceButton></div></div>
          </div>
        </section>

        <section className="border-t border-[#e8eaed] pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Márgenes</h3><div className="flex flex-wrap gap-1"><PresetButton label="Normal" onClick={() => onChange({ margins: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 } })} /><PresetButton label="Estrecho" onClick={() => onChange({ margins: { top: 1.27, right: 1.27, bottom: 1.27, left: 1.27 } })} /><PresetButton label="Moderado" onClick={() => onChange({ margins: { top: 2.54, right: 1.91, bottom: 2.54, left: 1.91 } })} /><PresetButton label="Ancho" onClick={() => onChange({ margins: { top: 2.54, right: 5.08, bottom: 2.54, left: 5.08 } })} /></div></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{([['top', 'Superior'], ['bottom', 'Inferior'], ['left', 'Izquierdo'], ['right', 'Derecho']] as const).map(([side, label]) => <label key={side} className="text-xs font-medium text-[#5f6368]">{label} (cm)<input type="number" min="0" max="10" step="0.1" value={settings.margins[side]} onChange={(event) => setMargin(side, Number(event.target.value))} className="mt-1.5 w-full rounded-md border border-[#dadce0] px-3 py-2 text-sm text-[#202124] outline-none focus:border-[#4285f4]" /></label>)}</div>
        </section>

        <section className="border-t border-[#e8eaed] pt-5">
          <div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold">Encabezado</h3><p className="mt-1 text-xs text-[#5f6368]">Puedes usar {'{título}'}, {'{fecha}'}, {'{página}'} y {'{total}'}.</p></div><Toggle checked={settings.headerEnabled} onChange={(checked) => onChange({ headerEnabled: checked })} /></div>
          {settings.headerEnabled && <div className="grid gap-3 sm:grid-cols-[1fr_150px]"><input value={settings.headerText} onChange={(event) => onChange({ headerText: event.target.value })} placeholder="Texto del encabezado" className="rounded-md border border-[#dadce0] px-3 py-2 outline-none focus:border-[#4285f4]" /><select value={settings.headerAlign} onChange={(event) => onChange({ headerAlign: event.target.value as PageSettings['headerAlign'] })} className="rounded-md border border-[#dadce0] bg-white px-3 py-2">{alignmentOptions}</select></div>}
          <label className="mt-3 flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={settings.differentFirstPage} onChange={(event) => onChange({ differentFirstPage: event.target.checked })} className="h-4 w-4 accent-[#0b57d0]" />Primera página diferente</label>
        </section>

        <section className="border-t border-[#e8eaed] pt-5">
          <div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold">Pie de página</h3><p className="mt-1 text-xs text-[#5f6368]">Admite las mismas variables del encabezado.</p></div><Toggle checked={settings.footerEnabled} onChange={(checked) => onChange({ footerEnabled: checked })} /></div>
          {settings.footerEnabled && <div className="grid gap-3 sm:grid-cols-[1fr_150px]"><input value={settings.footerText} onChange={(event) => onChange({ footerText: event.target.value })} placeholder="Texto del pie de página" className="rounded-md border border-[#dadce0] px-3 py-2 outline-none focus:border-[#4285f4]" /><select value={settings.footerAlign} onChange={(event) => onChange({ footerAlign: event.target.value as PageSettings['footerAlign'] })} className="rounded-md border border-[#dadce0] bg-white px-3 py-2">{alignmentOptions}</select></div>}
        </section>

        <section className="border-t border-[#e8eaed] pt-5">
          <div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold">Numeración de páginas</h3><p className="mt-1 text-xs text-[#5f6368]">Actívala solo cuando la necesites.</p></div><Toggle checked={settings.pageNumberEnabled} onChange={(checked) => onChange({ pageNumberEnabled: checked })} /></div>
          {settings.pageNumberEnabled && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SetupSelect label="Ubicación" value={settings.pageNumberPosition} onChange={(value) => onChange({ pageNumberPosition: value as PageSettings['pageNumberPosition'] })}><option value="header">Encabezado</option><option value="footer">Pie de página</option></SetupSelect>
            <SetupSelect label="Alineación" value={settings.pageNumberAlign} onChange={(value) => onChange({ pageNumberAlign: value as PageSettings['pageNumberAlign'] })}>{alignmentOptions}</SetupSelect>
            <SetupSelect label="Tipo de número" value={settings.pageNumberFormat} onChange={(value) => onChange({ pageNumberFormat: value as PageSettings['pageNumberFormat'] })}><option value="arabic">1, 2, 3…</option><option value="roman-lower">i, ii, iii…</option><option value="roman-upper">I, II, III…</option><option value="alpha-lower">a, b, c…</option><option value="alpha-upper">A, B, C…</option></SetupSelect>
            <SetupSelect label="Presentación" value={settings.pageNumberStyle} onChange={(value) => onChange({ pageNumberStyle: value as PageSettings['pageNumberStyle'] })}><option value="number">1</option><option value="page-number">Página 1</option><option value="number-total">1 de 5</option></SetupSelect>
            <label className="text-xs font-medium text-[#5f6368]">Comenzar en<input type="number" min="1" max="9999" value={settings.pageNumberStart} onChange={(event) => onChange({ pageNumberStart: Math.min(9999, Math.max(1, Number(event.target.value) || 1)) })} className="mt-1.5 w-full rounded-md border border-[#dadce0] px-3 py-2 text-sm text-[#202124]" /></label>
            <label className="flex items-end gap-2 pb-2 text-xs font-medium"><input type="checkbox" checked={settings.hideNumberOnFirstPage} onChange={(event) => onChange({ hideNumberOnFirstPage: event.target.checked })} className="h-4 w-4 accent-[#0b57d0]" />Ocultar en la primera página</label>
          </div>}
        </section>

        <section className="flex items-center justify-between border-t border-[#e8eaed] pt-5"><label className="flex items-center gap-3 font-medium">Color del papel<input type="color" value={settings.pageColor} onChange={(event) => onChange({ pageColor: event.target.value })} className="h-9 w-14 cursor-pointer rounded border border-[#dadce0] bg-white p-1" /></label><button onClick={onClose} className="rounded-full bg-[#0b57d0] px-5 py-2 text-sm font-medium text-white hover:bg-[#0842a0]">Listo</button></section>
      </div>
    </Modal>
  )
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-md border px-3 py-2 text-sm ${active ? 'border-[#e56517] bg-[#e56517]/15 text-[#f28a4a]' : 'border-[#292933] text-[#a8b0bf] hover:bg-[#1a1a21]'}`}>{children}</button>
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-md border border-[#292933] px-2.5 py-1 text-[11px] text-[#a8b0bf] hover:border-[#e56517]/50 hover:bg-[#e56517]/10 hover:text-[#f28a4a]">{label}</button>
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#e56517]' : 'bg-[#34343e]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} /></button>
}

function SetupSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="text-xs font-medium text-[#5f6368]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-md border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#202124]">{children}</select></label>
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="vertex-docs-modal fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-sm'} rounded-xl border border-[#292933] bg-[#0e0e13] p-6 text-[#f1f5f9] shadow-2xl`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between"><h2 className="font-sans text-lg font-medium tracking-normal">{title}</h2><button onClick={onClose} className="rounded-full p-2 hover:bg-[#f1f3f4]">×</button></div>
        {children}
      </div>
    </div>
  )
}
