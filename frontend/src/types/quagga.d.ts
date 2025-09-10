declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string;
      type: string;
      target: HTMLElement;
      constraints: {
        width: { min: number; ideal: number; max: number };
        height: { min: number; ideal: number; max: number };
        facingMode: string;
        aspectRatio: { ideal: number };
      };
    };
    decoder: {
      readers: string[];
    };
    locate: boolean;
    locator: {
      patchSize: string;
      halfSample: boolean;
      willReadFrequently: boolean;
      showCanvas: boolean;
      showPatches: boolean;
      showFoundPatches: boolean;
      showSkeleton: boolean;
      showLabels: boolean;
      showBoundingBoxes: boolean;
    };
    frequency: number;
    debug: {
      drawBoundingBox: boolean;
      showFrequency: boolean;
      drawScanline: boolean;
      drawLocations: boolean;
    };
    multiple: boolean;
  }

  interface QuaggaResult {
    codeResult: {
      code: string;
      format: string;
      quality: number;
    };
  }

  interface QuaggaStatic {
    init(config: QuaggaConfig, callback: (err: any) => void): void;
    start(): void;
    stop(): void;
    onDetected(callback: (data: QuaggaResult) => void): void;
    onProcessed(callback: (result: any) => void): void;
  }

  const Quagga: QuaggaStatic;
  export = Quagga;
}

