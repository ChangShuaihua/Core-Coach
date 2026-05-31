import Taro from '@tarojs/taro'

interface ShareImageData {
  gameName: string
  gameType: string
  age: number
  content: string
}

/**
 * 生成分享图片并保存到相册
 */
export async function generateAndSaveImage(data: ShareImageData): Promise<boolean> {
  try {
    const systemInfo = Taro.getSystemInfoSync()
    const screenWidth = systemInfo.screenWidth
    const canvasWidth = screenWidth * 0.9
    const dpr = systemInfo.pixelRatio

    // 先计算内容行数
    const maxWidth = canvasWidth - 60
    const lineHeight = 22
    const content = data.content || '暂无详细内容'
    const lines = wrapText(content, maxWidth, 14)

    // 根据内容计算 canvas 高度（标题高度动态）
    const titleLineCount = Math.ceil(((data.gameName || '新生成游戏').length * 20) / maxWidth) || 1
    const headerHeight = 50 + titleLineCount * 28 + 50 + 30
    const contentHeight = headerHeight + lines.length * lineHeight + 60
    const canvasHeight = Math.max(canvasWidth * 1.4, contentHeight)

    // 创建离屏 Canvas
    const query = Taro.createSelectorQuery()
    const canvasRes = await new Promise<any>((resolve) => {
      query
        .select('#shareCanvas')
        .fields({ node: true, size: true })
        .exec((res) => resolve(res[0]))
    })

    if (!canvasRes?.node) {
      console.error('Canvas 节点未找到')
      return false
    }

    const canvas = canvasRes.node
    const ctx = canvas.getContext('2d')

    // 设置 Canvas 尺寸
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    ctx.scale(dpr, dpr)

    // 绘制背景
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 绘制顶部橙色条
    ctx.fillStyle = '#FF7A2F'
    ctx.fillRect(0, 0, canvasWidth, 8)

    // 绘制标题（自动换行）
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 20px sans-serif'
    const titleLines = wrapText(data.gameName || '新生成游戏', maxWidth, 20)
    let titleY = 50
    titleLines.forEach((line) => {
      ctx.fillText(line, 30, titleY)
      titleY += 28
    })

    // 绘制标签
    ctx.fillStyle = '#FF7A2F'
    ctx.font = '12px sans-serif'
    ctx.fillText(data.gameType || '团队游戏', 30, titleY + 5)

    // 绘制基本信息
    ctx.fillStyle = '#6B7280'
    ctx.font = '14px sans-serif'
    ctx.fillText(`适合年龄：${data.age}岁`, 30, titleY + 30)

    // 绘制分隔线
    const separatorY = titleY + 50
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(30, separatorY)
    ctx.lineTo(canvasWidth - 30, separatorY)
    ctx.stroke()

    // 绘制完整内容
    ctx.fillStyle = '#374151'
    ctx.font = '14px sans-serif'
    let y = separatorY + 30
    lines.forEach((line) => {
      ctx.fillText(line, 30, y)
      y += lineHeight
    })

    // 绘制底部水印
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '12px sans-serif'
    ctx.fillText('来自「核心力量助手」', 30, canvasHeight - 20)

    // 转为图片
    const tempFilePath = await new Promise<string>((resolve, reject) => {
      Taro.canvasToTempFilePath({
        canvas,
        success: (res) => resolve(res.tempFilePath),
        fail: reject,
      })
    })

    // 保存到相册
    await Taro.saveImageToPhotosAlbum({
      filePath: tempFilePath,
    })

    return true
  } catch (error) {
    console.error('生成分享图片失败:', error)
    return false
  }
}

/**
 * 文字自动换行（纯文本计算，不依赖 ctx）
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }

    let currentLine = ''
    for (let i = 0; i < paragraph.length; i++) {
      const char = paragraph[i]
      const lineWidth = estimateWidth(currentLine, fontSize)
      const charW = estimateWidth(char, fontSize)

      if (lineWidth + charW > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine += char
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine)
    }
  }

  return lines
}

function estimateWidth(text: string, fontSize: number): number {
  let width = 0
  for (const char of text) {
    const code = char.codePointAt(0) || 0
    if (
      (code >= 0x4e00 && code <= 0x9fa5) || // CJK 中文
      (code >= 0x3000 && code <= 0x303f) || // CJK 标点
      (code >= 0xff00 && code <= 0xffef) || // 全角符号
      (code >= 0x2460 && code <= 0x24ff) || // 带圈数字 ①②③
      (code >= 0x2500 && code <= 0x257f) || // 制表符
      (code >= 0x25a0 && code <= 0x25ff) || // 几何符号 ◀▶
      (code >= 0x2600 && code <= 0x26ff) || // 杂项符号
      (code >= 0x2700 && code <= 0x27bf) || // 装饰符号
      (code >= 0x1f300 && code <= 0x1f9ff) // emoji
    ) {
      width += fontSize
    } else {
      width += fontSize * 0.55
    }
  }
  return width
}
