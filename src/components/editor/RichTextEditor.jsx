import React, { useCallback, useState, useEffect } from 'react'
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
  initialHtml = '', 
  onChange, 
  placeholder = 'Start writing...', 
  className = '',
  initialAlignment = 'top',
  contentKey = 'default'
}) => {
  const [currentFont, setCurrentFont] = useState('')
  const [currentTextColor, setCurrentTextColor] = useState('#000000')
  
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
    content: initialHtml,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange({
          html: editor.getHTML(),
          text: editor.getText()
        })
      }
    },
    editorProps: {
      attributes: {
        class: 'rte__content',
        placeholder: placeholder,
      },
    },
  })

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

  const setFontFamily = useCallback((fontFamily) => {
    if (fontFamily === 'default') {
      editor.chain().focus().unsetMark('textStyle').run()
    } else {
      editor.chain().focus().setMark('textStyle', { fontFamily }).run()
    }
  }, [editor])


  const setTextAlign = useCallback((alignment) => {
    if (alignment === 'justify') {
      editor.commands.setTextAlign('left')
      // Add justify class to content wrapper
      const contentElement = editor.view.dom.querySelector('.rte__content')
      if (contentElement) {
        contentElement.classList.add('text-justify')
      }
    } else {
      // Remove justify class if switching away from justify
      const contentElement = editor.view.dom.querySelector('.rte__content')
      if (contentElement) {
        contentElement.classList.remove('text-justify')
      }
      editor.commands.setTextAlign(alignment)
    }
  }, [editor])

  const setVerticalAlign = useCallback((alignment) => {
    const wrapper = editor.view.dom.closest('.rte')
    if (wrapper) {
      wrapper.classList.remove('rte-vtop', 'rte-vmiddle', 'rte-vbottom')
      wrapper.classList.add(`rte-v${alignment}`)
    }
  }, [editor])

  // Subscribe to selection updates to track font and color changes
  useEffect(() => {
    if (!editor) return

    const syncAttrs = () => {
      setCurrentFont(editor.getAttributes('textStyle')?.fontFamily || '')
      setCurrentTextColor(editor.getAttributes('textStyle')?.color || '#000000')
    }

    editor.on('update', syncAttrs)
    editor.on('selectionUpdate', syncAttrs)
    syncAttrs()

    return () => {
      editor.off('update', syncAttrs)
      editor.off('selectionUpdate', syncAttrs)
    }
  }, [editor])

  // Sync content when initialHtml or contentKey changes
  useEffect(() => {
    if (editor && initialHtml && editor.getHTML() !== initialHtml) {
      editor.commands.setContent(initialHtml, true)
    }
  }, [editor, initialHtml, contentKey])

  if (!editor) {
    return null
  }


  return (
    <div className={`rte rte-v${initialAlignment} ${className}`}>
      <div className="rte__toolbar">
        {/* Paragraph Style */}
        <div className="rte__group">
          <select
            className="rte__select"
            value={editor.getAttributes('heading').level || 'paragraph'}
            onChange={(e) => {
              const level = e.target.value
              if (level === 'paragraph') {
                editor.chain().focus().setParagraph().run()
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(level) }).run()
              }
            }}
          >
            <option value="paragraph">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
          </select>
        </div>

        {/* Font Family */}
        <div className="rte__group">
          <select
            className="rte__select rte__select--font"
            value={currentFont}
            onChange={(e) => {
              const val = e.target.value
              if (!val) {
                editor?.chain().focus().unsetMark('textStyle').run()
              } else {
                editor?.chain().focus().setMark('textStyle', { fontFamily: val }).run()
              }
            }}
            aria-label="Font family"
          >
            <option value="Arial">Arial</option>
            <option value="'Public Sans'">Public Sans</option>
            <option value="'Times New Roman'">Times New Roman</option>
          </select>
        </div>

        {/* Text Formatting */}
        <div className="rte__group">
          <button
            type="button"
            className={`rte__btn ${editor.isActive('bold') ? 'rte__btn--active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('italic') ? 'rte__btn--active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('underline') ? 'rte__btn--active' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('strike') ? 'rte__btn--active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        {/* Text Color */}
        <div className="rte__group">
          <input
            type="color"
            className="rte__color-input rte__color-input--text"
            value={currentTextColor}
            onChange={(e) => {
              editor?.chain().focus().setColor(e.target.value).run();
              // Update the background color using CSS custom property
              e.target.style.setProperty('--current-color', e.target.value);
              e.target.classList.add('rte__color-input--custom-color');
            }}
            aria-label="Text color"
          />
          <button
            type="button"
            className="rte__btn rte__btn--clear-text-color"
            onClick={() => {
              editor?.chain().focus().unsetColor().run();
              // Reset the background color to default
              const colorInput = document.querySelector('.rte__color-input--text');
              if (colorInput) {
                colorInput.style.removeProperty('--current-color');
                colorInput.classList.remove('rte__color-input--custom-color');
              }
            }}
            aria-label="Clear text color"
          >
            Clear
          </button>
        </div>

        {/* Lists */}
        <div className="rte__group">
          <button
            type="button"
            className={`rte__btn ${editor.isActive('bulletList') ? 'rte__btn--active' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('orderedList') ? 'rte__btn--active' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            1.
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive('taskList') ? 'rte__btn--active' : ''}`}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Task List"
          >
            ☐
          </button>
        </div>

        {/* Links and Images */}
        <div className="rte__group">
          <button
            type="button"
            className={`rte__btn ${editor.isActive('link') ? 'rte__btn--active' : ''}`}
            onClick={setLink}
            title="Insert Link"
          >
            🔗
          </button>
          <button
            type="button"
            className="rte__btn"
            onClick={setImage}
            title="Insert Image"
          >
            🖼️
          </button>
        </div>

        {/* History */}
        <div className="rte__group">
          <button
            type="button"
            className="rte__btn"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            ↶
          </button>
          <button
            type="button"
            className="rte__btn"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            ↷
          </button>
        </div>

        {/* Text Alignment */}
        <div className="rte__group">
          <button
            type="button"
            className={`rte__btn ${editor.isActive({ textAlign: 'left' }) ? 'rte__btn--active' : ''}`}
            onClick={() => setTextAlign('left')}
            title="Align Left"
          >
            ⬅
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive({ textAlign: 'center' }) ? 'rte__btn--active' : ''}`}
            onClick={() => setTextAlign('center')}
            title="Align Center"
          >
            ↔
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.isActive({ textAlign: 'right' }) ? 'rte__btn--active' : ''}`}
            onClick={() => setTextAlign('right')}
            title="Align Right"
          >
            ➡
          </button>
          <button
            type="button"
            className={`rte__btn ${editor.view.dom.querySelector('.rte__content')?.classList.contains('text-justify') ? 'rte__btn--active' : ''}`}
            onClick={() => setTextAlign('justify')}
            title="Justify"
          >
            ⬌
          </button>
        </div>
      </div>

      <div 
        className="rte__content-wrapper"
        onMouseDown={(e) => {
          if (!editor?.isFocused) {
            e.preventDefault()
            editor?.commands.focus('end')
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default RichTextEditor
