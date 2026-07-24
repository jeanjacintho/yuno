export type ByteRange = {
  start: number
  end: number
}

export function parseRangeHeader(
  rangeHeader: string | undefined,
  fileSize: number
): ByteRange | null | 'invalid' {
  if (!rangeHeader) return null

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
  if (!match) return 'invalid'

  const [, startPart, endPart] = match
  let start = startPart ? Number(startPart) : NaN
  let end = endPart ? Number(endPart) : NaN

  if (startPart === '' && endPart) {
    const suffixLength = Number(endPart)
    if (!Number.isFinite(suffixLength)) return 'invalid'
    start = Math.max(fileSize - suffixLength, 0)
    end = fileSize - 1
  } else if (startPart && endPart === '') {
    start = Number(startPart)
    end = fileSize - 1
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'invalid'
  if (start < 0 || end < start || start >= fileSize) return 'invalid'

  end = Math.min(end, fileSize - 1)
  return { start, end }
}
