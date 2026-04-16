declare module 'html-to-docx' {
  interface DocxOptions {
    table?: { row?: { cantSplit?: boolean } };
    font?: string;
    fontSize?: number;
    margins?: { top?: number; bottom?: number; left?: number; right?: number };
  }

  function HTMLtoDOCX(
    html: string,
    headerHtml: string | null,
    options?: DocxOptions
  ): Promise<Blob>;

  export default HTMLtoDOCX;
}
