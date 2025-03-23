declare module "bwip-js" {
  export interface BwipOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: string;
    backgroundcolor?: string;
    [key: string]: any;
  }

  export function toBuffer(
    options: BwipOptions,
    callback: (err: Error | null, buffer: Buffer) => void
  ): void;

  export function toCanvas(
    canvas: HTMLCanvasElement,
    options: BwipOptions
  ): void;

  const bwipjs: {
    toBuffer: typeof toBuffer;
    toCanvas: typeof toCanvas;
  };

  export default bwipjs;
}
