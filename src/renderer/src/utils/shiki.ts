import { useTheme } from '@renderer/context/ThemeProvider'
import { ThemeMode } from '@renderer/types'
import { MarkdownItShikiOptions, setupMarkdownIt } from '@shikijs/markdown-it'
import MarkdownIt from 'markdown-it'
import { useEffect, useRef, useState } from 'react'
import { BuiltinLanguage, BuiltinTheme, bundledLanguages, createHighlighter } from 'shiki'
import { getTokenStyleObject, ThemedToken } from 'shiki/core'

/**
 * Shiki token 样式转换为 React 样式对象
 *
 * @param token Shiki themed token
 * @returns React 样式对象
 */
export function getReactStyleFromToken(token: ThemedToken): Record<string, string> {
  const style = token.htmlStyle || getTokenStyleObject(token)
  const reactStyle: Record<string, string> = {}
  for (const [key, value] of Object.entries(style)) {
    switch (key) {
      case 'font-style':
        reactStyle.fontStyle = value
        break
      case 'font-weight':
        reactStyle.fontWeight = value
        break
      case 'background-color':
        reactStyle.backgroundColor = value
        break
      case 'text-decoration':
        reactStyle.textDecoration = value
        break
      default:
        reactStyle[key] = value
    }
  }
  return reactStyle
}

const defaultOptions = {
  themes: {
    light: 'one-light',
    dark: 'material-theme-darker'
  },
  defaultColor: 'light'
}

const initHighlighter = async (options: MarkdownItShikiOptions) => {
  const themeNames = ('themes' in options ? Object.values(options.themes) : [options.theme]).filter(
    Boolean
  ) as BuiltinTheme[]
  return await createHighlighter({
    themes: themeNames,
    langs: options.langs || (Object.keys(bundledLanguages) as BuiltinLanguage[])
  })
}

const highlighter = await initHighlighter(defaultOptions)

export function getShikiInstance(theme: ThemeMode) {
  const options = {
    ...defaultOptions,
    defaultColor: theme
  }

  return function (markdownit: MarkdownIt) {
    setupMarkdownIt(markdownit, highlighter, options)
  }
}

export function useShikiWithMarkdownIt(content: string) {
  const [renderedMarkdown, setRenderedMarkdown] = useState('')
  const md = useRef<MarkdownIt>(
    new MarkdownIt({
      linkify: true, // 自动转换 URL 为链接
      typographer: true // 启用印刷格式优化
    })
  )
  const { theme } = useTheme()
  useEffect(() => {
    const sk = getShikiInstance(theme)
    md.current.use(sk)
    setRenderedMarkdown(md.current.render(content))
  }, [content, theme])
  return {
    renderedMarkdown
  }
}
