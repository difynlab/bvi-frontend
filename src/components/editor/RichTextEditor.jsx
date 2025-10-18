import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { TextStyle } from '@tiptap/extension-text-style'
import { Extension } from '@tiptap/core'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import CustomDropdown from '../CustomDropdown'
import '../../styles/components/RichTextEditor.scss'

// Extensión personalizada para FontFamily
const FontFamily = Extension.create({
  name: 'fontFamily',
  
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: element => element.style.fontFamily?.replace(/['"]/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontFamily) {
                return {}
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontFamily: fontFamily => ({ chain }) => {
        // Solo aplicar a la selección actual, no a todo el texto
        return chain().focus().setMark('textStyle', { fontFamily }).run()
      },
      unsetFontFamily: () => ({ chain }) => {
        return chain()
          .focus()
          .setMark('textStyle', { fontFamily: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

const RichTextEditor = ({
  docId,
  initialHTML = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  initialAlignment = 'top'
}) => {
  const [currentFont, setCurrentFont] = useState('')
  const [currentTextColor, setCurrentTextColor] = useState('#000000')
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  // Stable editor configuration - no dynamic dependencies
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Excluir extensiones que agregamos por separado para evitar duplicación
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        validate: href => /^https?:\/\//i.test(href)
      }),
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextStyle,
      FontFamily,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
    ],
    content: initialHTML || '',
    autofocus: false,
    onUpdate: ({ editor }) => {
      // DO NOT call setContent here - one-way flow
      onChange?.({ html: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        class: 'rte__content',
        placeholder: placeholder,
      },
    },
    onCreate: ({ editor }) => {
      // Editor creado exitosamente
    },
  }, []) // No dynamic dependencies


  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    setIsLinkInputOpen(true)
  }, [editor])

  const handleLinkConfirm = useCallback(() => {
    if (linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run()
    }
    setIsLinkInputOpen(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const handleLinkDiscard = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setIsLinkInputOpen(false)
    setLinkUrl('')
  }, [editor])

  const handleLinkCancel = useCallback(() => {
    setIsLinkInputOpen(false)
    setLinkUrl('')
  }, [])


  const setImage = useCallback(() => {
    const url = window.prompt('Image URL')

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  // const setFontFamily = useCallback((fontFamily) => {
  //   if (fontFamily === 'default') {
  //     editor.chain().focus().unsetMark('textStyle').run()
  //   } else {
  //     editor.chain().focus().setMark('textStyle', { fontFamily }).run()
  //   }
  // }, [editor])


  const setTextAlign = useCallback((alignment) => {
    editor.commands.setTextAlign(alignment)
  }, [editor])

  // const setVerticalAlign = useCallback((alignment) => {
  //   const wrapper = editor.view.dom.closest('.rte')
  //   if (wrapper) {
  //     wrapper.classList.remove('rte-vtop', 'rte-vmiddle', 'rte-vbottom')
  //     wrapper.classList.add(`rte-v${alignment}`)
  //   }
  // }, [editor])

  useEffect(() => {
    if (!editor) return

    const syncAttrs = () => {
      setCurrentFont(editor.getAttributes('textStyle')?.fontFamily || '')

      // Get the current text color from the editor
      const textColor = editor.getAttributes('textStyle')?.color
      const finalColor = textColor || '#000000'

      setCurrentTextColor(finalColor)

      // Update CSS custom property for visual feedback
      const colorInput = document.querySelector('.rte__color-input--text')
      if (colorInput) {
        colorInput.style.setProperty('--current-color', finalColor)
      }
    }

    editor.on('update', syncAttrs)
    editor.on('selectionUpdate', syncAttrs)
    editor.on('transaction', syncAttrs)
    editor.on('focus', syncAttrs)
    editor.on('blur', syncAttrs)
    syncAttrs()

    return () => {
      editor.off('update', syncAttrs)
      editor.off('selectionUpdate', syncAttrs)
      editor.off('transaction', syncAttrs)
      editor.off('focus', syncAttrs)
      editor.off('blur', syncAttrs)
    }
  }, [editor])

  // Only update content when docId changes (new record opened)
  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(initialHTML || '', false)
  }, [editor, docId])

  if (!editor) {
    return null
  }

  return (
    <div className={`rte rte-v${initialAlignment} ${className}`}>
      <div className="rte__toolbar">
        <div className="rte__toolbar-mobile">
          <div className="rte__group">
            <CustomDropdown
              className="rte__select"
              value={editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : 'paragraph'}
              onChange={(e) => {
                const level = e.target.value
                
                // 🔧 SOLUCIÓN: Aplicar solo al párrafo/línea actual
                if (level === 'paragraph') {
                  // Convertir a párrafo normal
                  editor.chain().focus().setParagraph().run()
                } else if (level === '1') {
                  // Convertir a Heading 1
                  editor.chain().focus().setHeading({ level: 1 }).run()
                } else if (level === '2') {
                  // Convertir a Heading 2
                  editor.chain().focus().setHeading({ level: 2 }).run()
                }
              }}
              options={[
                { value: 'paragraph', label: 'Paragraph' },
                { value: '1', label: 'Heading 1' },
                { value: '2', label: 'Heading 2' }
              ]}
              placeholder="Select format"
              variant="wysiwyg"
            />
          </div>

          <div className="rte__group">
            <CustomDropdown
              className="rte__select rte__select--font"
              value={currentFont}
              onChange={(e) => {
                const val = e.target.value
                
                if (!val) {
                  editor.chain().focus().unsetFontFamily().run()
                } else {
                  editor.chain().focus().setFontFamily(val).run()
                }
              }}
              options={[
                { value: 'Arial', label: 'Arial' },
                { value: 'Public Sans', label: 'Public Sans' },
                { value: 'Times New Roman', label: 'Times New Roman' }
              ]}
              placeholder="Select font"
              variant="wysiwyg"
            />
          </div>
        </div>
        <div className="rte__group">
          <button
            type="button"
            className={`rte__btn ${editor.isActive('bold') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleBold().run()
            }}
            title="Bold"
          >
            <i className="bi bi-type-bold"></i>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('italic') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleItalic().run()
            }}
            title="Italic"
          >
            <i className="bi bi-type-italic"></i>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('underline') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleUnderline().run()
            }}
            title="Underline"
          >
            <i className="bi bi-type-underline"></i>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('strike') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleStrike().run()
            }}
            title="Strikethrough"
          >
            <i className="bi bi-type-strikethrough"></i>
          </button>
        </div>

        <div className="rte__group rte__color">
          <input
            type="color"
            className="rte__color-input rte__color-input--text"
            value={currentTextColor}
            onChange={(e) => {
              const newColor = e.target.value
              editor?.chain().focus().setColor(newColor).run()
              setCurrentTextColor(newColor)
              e.target.style.setProperty('--current-color', newColor)
            }}
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Text color"
          />
          <button
            type="button"
            className="rte__btn rte__btn--clear-text-color"
            onMouseDown={(e) => {
              e.preventDefault()
              editor?.chain().focus().unsetColor().run()
              setCurrentTextColor('#000000')
              const colorInput = document.querySelector('.rte__color-input--text')
              if (colorInput) {
                colorInput.style.setProperty('--current-color', '#000000')
              }
            }}
            aria-label="Clear text color"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="rte__group">
          <button
            type="button"
            className={`rte__btn ${editor.isActive('bulletList') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleBulletList().run()
            }}
            title="Bullet List"
          >
            <i className="bi bi-list-ul"></i>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('orderedList') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleOrderedList().run()
            }}
            title="Numbered List"
          >
            <i className="bi bi-list-ol"></i>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('taskList') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleTaskList().run()
            }}
            title="Task List"
          >
            <i className="bi bi-list-check"></i>
          </button>
        </div>

        <div className="rte__group rte__link-group">
          <button
            type="button"
            className={`rte__btn ${editor.isActive('link') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              setLink()
            }}
            title="Insert Link"
          >
            <i className="bi bi-link-45deg"></i>
          </button>
          
          <button
            type="button"
            className="rte__btn"
            onMouseDown={(e) => {
              e.preventDefault()
              setImage()
            }}
            title="Insert Image"
          >
            <i className="bi bi-image"></i>
          </button>
        </div>

        <div className="rte__group">
          <button
            type="button"
            className="rte__btn"
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().undo().run()
            }}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
          <button
            type="button"
            className="rte__btn"
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().redo().run()
            }}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>

        <div className="rte__group">
          <button
            type="button"
            className={`rte__btn ${editor.isActive({ textAlign: 'left' }) ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              setTextAlign('left')
            }}
            title="Align Left"
          >
            <i className="bi bi-text-left"></i>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive({ textAlign: 'center' }) ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              setTextAlign('center')
            }}
            title="Align Center"
          >
            <i className="bi bi-text-center"></i>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive({ textAlign: 'right' }) ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              setTextAlign('right')
            }}
            title="Align Right"
          >
            <i className="bi bi-text-right"></i>
          </button>
        </div>
      </div>

      <div
        className="rte__content-wrapper"
        onMouseDown={(e) => {
          if (!editor?.isFocused) {
            e.preventDefault()
            editor?.commands.focus()
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Modal para insertar/editar link */}
      {isLinkInputOpen && (
        <div className="rte__link-modal-overlay" onClick={handleLinkCancel}>
          <div className="rte__link-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rte__link-modal-header">
              <h3 className="rte__link-modal-title">Insertar/Editar Enlace</h3>
              <button
                type="button"
                className="rte__link-modal-close"
                onClick={handleLinkCancel}
                title="Cerrar"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="rte__link-modal-body">
              <div className="rte__link-modal-field">
                <label className="rte__link-modal-label">URL:</label>
                <input
                  type="url"
                  className="rte__link-modal-input"
                  placeholder="https://ejemplo.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLinkConfirm()
                    } else if (e.key === 'Escape') {
                      handleLinkCancel()
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="rte__link-modal-footer">
              <button
                type="button"
                className="rte__btn rte__btn--secondary"
                onClick={handleLinkDiscard}
                title="Remover enlace"
              >
                <i className="bi bi-trash"></i>
                <span>Remover</span>
              </button>
              <button
                type="button"
                className="rte__btn rte__btn--primary"
                onClick={handleLinkConfirm}
                title="Confirmar enlace"
              >
                <i className="bi bi-check"></i>
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RichTextEditor
