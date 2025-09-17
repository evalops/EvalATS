declare module 'pdf-parse' {
  interface PDFParseResult {
    numpages: number
    numrender: number
    info: Record<string, unknown>
    metadata: unknown
    version: string
    text: string
  }

  type PDFData = ArrayBuffer | Uint8Array | Buffer

  interface PDFParseOptions {
    max?: number
    version?: string
  }

  export default function pdf(
    data: PDFData,
    options?: PDFParseOptions
  ): Promise<PDFParseResult>
}
