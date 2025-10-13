import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import '../../styles/components/RichTextEditor.scss'

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

  // Stable editor configuration - no dynamic dependencies
  const editor = useEditor({
    extensions: [
      StarterKit,
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
  }, []) // No dynamic dependencies

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

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
    if (alignment === 'justify') {
      editor.commands.setTextAlign('left')
      const contentElement = editor.view.dom.querySelector('.rte__content')
      if (contentElement) {
        contentElement.classList.add('text-justify')
      }
    } else {
      const contentElement = editor.view.dom.querySelector('.rte__content')
      if (contentElement) {
        contentElement.classList.remove('text-justify')
      }
      editor.commands.setTextAlign(alignment)
    }
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
            <select
              className="rte__select"
              value={editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : 'paragraph'}
              onChange={(e) => {
                const level = e.target.value
                const chain = editor.chain().focus()

                if (level === 'paragraph') {
                  // Remove any heading and convert to paragraph
                  if (editor.isActive('heading', { level: 1 })) {
                    chain.toggleHeading({ level: 1 }).run()
                  } else if (editor.isActive('heading', { level: 2 })) {
                    chain.toggleHeading({ level: 2 }).run()
                  }
                  // If already paragraph, do nothing
                } else if (level === '1') {
                  // Convert to heading 1
                  if (editor.isActive('heading', { level: 2 })) {
                    chain.toggleHeading({ level: 2 }).run()
                  }
                  chain.toggleHeading({ level: 1 }).run()
                } else if (level === '2') {
                  // Convert to heading 2
                  if (editor.isActive('heading', { level: 1 })) {
                    chain.toggleHeading({ level: 1 }).run()
                  }
                  chain.toggleHeading({ level: 2 }).run()
                }
              }}
            >
              <option value="paragraph">Paragraph</option>
              <option value="1">Heading 1</option>
              <option value="2">Heading 2</option>
            </select>
          </div>

          <div className="rte__group">
            <select
              className="rte__select rte__select--font"
              value={currentFont}
              onChange={(e) => {
                const val = e.target.value
                const chain = editor.chain().focus()
                if (!val) {
                  chain.unsetMark('textStyle').run()
                } else {
                  chain.setMark('textStyle', { fontFamily: val }).run()
                }
              }}
              aria-label="Font family"
            >
              <option value="Arial">Arial</option>
              <option value="'Public Sans'">Public Sans</option>
              <option value="'Times New Roman'">Times New Roman</option>
            </select>
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

        <div className="rte__group">
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
          <button
            type="button"
            className={`rte__btn ${editor.view.dom.querySelector('.rte__content')?.classList.contains('text-justify') ? 'rte__btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              setTextAlign('justify')
            }}
            title="Justify"
          >
            <i className="bi bi-justify"></i>
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
    </div>
  )
}

export default RichTextEditor
