import { marked } from 'marked'

// 配置 marked：启用 GFM（表格、任务列表等），保留换行
marked.setOptions({
  gfm: true,
  breaks: true,
})

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}
