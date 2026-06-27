export const textSizeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Large', value: 'large' },
  { label: 'Heading', value: 'heading' },
  { label: 'Signal', value: 'signal' },
]

const ALLOWED_TEXT_SIZES = new Set(textSizeOptions.map((option) => option.value))

function createBlockId() {
  return crypto.randomUUID()
}

export function normalizeStringList(list) {
  if (!Array.isArray(list)) {
    return []
  }

  return list.map((item) => String(item || '').trim()).filter(Boolean)
}

export function normalizeDelimitedList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function createTextBlock(content = '', size = 'normal') {
  return {
    id: createBlockId(),
    type: 'text',
    size,
    signalColor: '#4fc3ff',
    content,
  }
}

export function createImageBlock(url = '', alt = '') {
  return {
    id: createBlockId(),
    type: 'image',
    url,
    alt,
  }
}

export function createGmNoteBlock(content = '') {
  return {
    id: createBlockId(),
    type: 'gm-note',
    content,
  }
}

export function createAccordionItem(title = '', content = '') {
  return {
    id: createBlockId(),
    title,
    content,
  }
}

export function createAccordionBlock(items = [createAccordionItem()]) {
  return {
    id: createBlockId(),
    type: 'accordion',
    items,
  }
}

export function createReferenceSection(title = '', content = '') {
  return {
    id: createBlockId(),
    title,
    content,
  }
}

export function createReferenceBlock(sections = [createReferenceSection()]) {
  return {
    id: createBlockId(),
    type: 'reference',
    borderColor: '#4fc3ff',
    title: '',
    content: '',
    sections,
  }
}

export function createBlankBlockList() {
  return [createTextBlock()]
}

export function normalizeContentBlocks(blocks) {
  if (!Array.isArray(blocks)) {
    return []
  }

  return blocks
    .map((block) => {
      if (block?.type === 'image') {
        return {
          type: 'image',
          url: String(block.url || '').trim(),
          alt: String(block.alt || '').trim(),
        }
      }

      if (block?.type === 'gm-note') {
        return {
          type: 'gm-note',
          content: String(block.content || '').trim(),
        }
      }

      if (block?.type === 'accordion') {
        return {
          type: 'accordion',
          items: normalizeAccordionItems(block.items),
        }
      }

      if (block?.type === 'reference') {
        return {
          type: 'reference',
          borderColor: normalizeColor(block.borderColor, '#4fc3ff'),
          title: String(block.title || '').trim(),
          content: String(block.content || '').trim(),
          sections: normalizeReferenceSections(block.sections),
        }
      }

      return {
        type: 'text',
        size: ALLOWED_TEXT_SIZES.has(block?.size) ? block.size : 'normal',
        signalColor: normalizeColor(block?.signalColor, '#4fc3ff'),
        content: String(block?.content || '').trim(),
      }
    })
    .filter(isFilledContentBlock)
}

export function normalizeEditorBlocks(blocks) {
  return normalizeContentBlocks(blocks)
}

export function formBlocksFromContent(contentBlocks, fallbackBody = []) {
  if (contentBlocks.length) {
    return contentBlocks.map((block) => {
      if (block.type === 'image') {
        return createImageBlock(block.url, block.alt)
      }

      if (block.type === 'gm-note') {
        return createGmNoteBlock(block.content)
      }

      if (block.type === 'accordion') {
        return createAccordionBlock(
          block.items.length
            ? block.items.map((item) => createAccordionItem(item.title, item.content))
            : [createAccordionItem()],
        )
      }

      if (block.type === 'reference') {
        return {
          id: createBlockId(),
          type: 'reference',
          borderColor: block.borderColor,
          title: block.title,
          content: block.content,
          sections: block.sections.length
            ? block.sections.map((section) => createReferenceSection(section.title, section.content))
            : [createReferenceSection()],
        }
      }

      return {
        ...createTextBlock(block.content, block.size),
        signalColor: block.signalColor || '#4fc3ff',
      }
    })
  }

  return fallbackBody.length ? fallbackBody.map((paragraph) => createTextBlock(paragraph)) : createBlankBlockList()
}

export function slugify(value, fallback = 'post') {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || fallback
}

export function findInvalidImageBlock(blocks) {
  return blocks.find((block) => block.type === 'image' && !/^https?:\/\//i.test(block.url))
}

function normalizeAccordionItems(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => ({
      title: String(item?.title || '').trim(),
      content: String(item?.content || '').trim(),
    }))
    .filter((item) => item.title || item.content)
}

function normalizeReferenceSections(sections) {
  if (!Array.isArray(sections)) {
    return []
  }

  return sections
    .map((section) => ({
      title: String(section?.title || '').trim(),
      content: String(section?.content || '').trim(),
    }))
    .filter((section) => section.title || section.content)
}

function normalizeColor(color, fallback) {
  const value = String(color || '').trim()
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function isFilledContentBlock(block) {
  if (block.type === 'image') {
    return block.url
  }

  if (block.type === 'accordion') {
    return block.items.length > 0
  }

  if (block.type === 'reference') {
    return block.title || block.content || block.sections.length > 0
  }

  return block.content
}
