/**
 * NEUROSYNC // Client-Side 1D-CNN EEG Denoiser Engine
 * Exact in-browser replica of EEG_BCI_Export PyTorch model weights.
 * Enables 100% offline & GitHub Pages static deployment with zero external backend required.
 */

interface LayerWeight {
  shape: number[];
  data: Float32Array;
}

let cachedWeights: Record<string, LayerWeight> | null = null;
let isLoadingWeights = false;
let initPromise: Promise<Record<string, LayerWeight>> | null = null;

// Error function approximation (Abramowitz & Stegun 7.1.26)
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX));
  return sign * y;
}

// PyTorch standard GELU
function gelu(x: number): number {
  return 0.5 * x * (1.0 + erf(x / 1.4142135623730951));
}

// Recursive array flattener
function flattenToFloat32(arr: unknown): Float32Array {
  const flat: number[] = [];
  function rec(sub: unknown) {
    if (Array.isArray(sub)) {
      for (let i = 0; i < sub.length; i++) rec(sub[i]);
    } else if (typeof sub === 'number') {
      flat.push(sub);
    }
  }
  rec(arr);
  return new Float32Array(flat);
}

// 1D Convolution with padding and dilation matching PyTorch Conv1d
function conv1d(
  x: Float32Array,
  wObj: LayerWeight,
  bObj: LayerWeight,
  padding: number = 0,
  dilation: number = 1
): Float32Array {
  const [cOut, cIn, k] = wObj.shape;
  const inLen = x.length / cIn;
  const outLen = inLen;
  const w = wObj.data;
  const b = bObj.data;

  const out = new Float32Array(cOut * outLen);

  for (let co = 0; co < cOut; co++) {
    const outOffset = co * outLen;
    const bVal = b[co];

    for (let l = 0; l < outLen; l++) {
      out[outOffset + l] = bVal;
    }

    for (let ci = 0; ci < cIn; ci++) {
      const inOffset = ci * inLen;
      const wCoCiOffset = (co * cIn + ci) * k;

      for (let ki = 0; ki < k; ki++) {
        const wVal = w[wCoCiOffset + ki];
        const shift = ki * dilation - padding;

        for (let l = 0; l < outLen; l++) {
          const inIdx = l + shift;
          if (inIdx >= 0 && inIdx < inLen) {
            out[outOffset + l] += wVal * x[inOffset + inIdx];
          }
        }
      }
    }
  }

  return out;
}

/**
 * Initializes and caches the trained PyTorch weights from the public assets folder.
 */
export async function initClientDenoiser(): Promise<Record<string, LayerWeight>> {
  if (cachedWeights) return cachedWeights;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    isLoadingWeights = true;
    try {
      // Try resolving weights relative to site base (works on GitHub Pages and local)
      const baseUrl = import.meta.env.BASE_URL || './';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const possibleUrls = [
        `${cleanBase}assets/denoiser_weights.json`,
        './assets/denoiser_weights.json',
        '/assets/denoiser_weights.json'
      ];

      let jsonText: string | null = null;
      for (const url of possibleUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            jsonText = await res.text();
            break;
          }
        } catch {
          // try next
        }
      }

      if (!jsonText) {
        throw new Error('Could not fetch denoiser_weights.json');
      }

      const parsed = JSON.parse(jsonText);
      const rawWeights = parsed.weights;

      const converted: Record<string, LayerWeight> = {};
      for (const [k, v] of Object.entries(rawWeights as Record<string, { shape: number[]; data: unknown }>)) {
        converted[k] = {
          shape: v.shape,
          data: flattenToFloat32(v.data)
        };
      }

      cachedWeights = converted;
      return converted;
    } finally {
      isLoadingWeights = false;
    }
  })();

  return initPromise;
}

/**
 * Denoises a single 512-sample EEG window using the in-browser CNN engine.
 */
function denoiseWindow512(signal: Float32Array, weights: Record<string, LayerWeight>): Float32Array {
  const n = 512;
  let sumSq = 0;
  for (let i = 0; i < n; i++) sumSq += signal[i] * signal[i];
  const scale = Math.max(Math.sqrt(sumSq / n), 1e-6);

  let h = new Float32Array(n);
  for (let i = 0; i < n; i++) h[i] = signal[i] / scale;

  // 1. Input layer: Conv1d(1, 32, k=9, p=4)
  h = conv1d(h, weights['input_layer.weight'], weights['input_layer.bias'], 4, 1);

  // 2. 6 Residual Blocks with dilations [1, 2, 4, 8, 1, 2]
  const dilations = [1, 2, 4, 8, 1, 2];
  for (let b = 0; b < dilations.length; b++) {
    const dil = dilations[b];
    const res = new Float32Array(h);

    const out1 = conv1d(h, weights[`blocks.${b}.conv1.weight`], weights[`blocks.${b}.conv1.bias`], 4 * dil, dil);
    for (let i = 0; i < out1.length; i++) out1[i] = gelu(out1[i]);

    const out2 = conv1d(out1, weights[`blocks.${b}.conv2.weight`], weights[`blocks.${b}.conv2.bias`], 4, 1);
    for (let i = 0; i < out2.length; i++) {
      h[i] = gelu(out2[i] + res[i]);
    }
  }

  // 3. Output layer: Conv1d(32, 1, k=9, p=4)
  const predictedNoise = conv1d(h, weights['output_layer.weight'], weights['output_layer.bias'], 4, 1);

  // 4. Un-normalize
  const cleaned = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    cleaned[i] = (signal[i] / scale - predictedNoise[i]) * scale;
  }

  return cleaned;
}

export interface ClientDenoiseResult {
  status: 'success';
  model: 'EEG_1D_CNN_Denoiser';
  inference_latency_ms: number;
  sampling_rate: number;
  sample_count: number;
  raw_signal: number[];
  cleaned_signal: number[];
  noise_signal: number[];
  metrics: {
    input_rms: number;
    output_rms: number;
    noise_rms: number;
    input_peak: number;
    output_peak: number;
    noise_reduction_pct: number;
    has_clean_reference: boolean;
    reference_note: string;
  };
}

/**
 * Full signal denoising (handles signals of any length using symmetric padding or overlap-add Hann windows).
 */
export async function denoiseFullSignalClient(rawSignal: number[]): Promise<ClientDenoiseResult> {
  const weights = await initClientDenoiser();
  const t0 = performance.now();

  const n = rawSignal.length;
  const inArr = new Float32Array(rawSignal);
  let cleanedArr: Float32Array;

  if (n === 512) {
    cleanedArr = denoiseWindow512(inArr, weights);
  } else if (n < 512) {
    // Pad symmetrically to 512 samples
    const padded = new Float32Array(512);
    for (let i = 0; i < n; i++) padded[i] = inArr[i];
    const lastVal = inArr[n - 1] || 0;
    for (let i = n; i < 512; i++) padded[i] = lastVal;
    const cleanedPadded = denoiseWindow512(padded, weights);
    cleanedArr = cleanedPadded.slice(0, n);
  } else {
    // Multi-window Hann overlap-add
    cleanedArr = new Float32Array(n);
    const weightSum = new Float32Array(n);
    const step = 256;
    const windowSize = 512;

    const hann = new Float32Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
    }

    for (let start = 0; start <= n - windowSize; start += step) {
      const chunk = inArr.slice(start, start + windowSize);
      const cleanedChunk = denoiseWindow512(chunk, weights);
      for (let i = 0; i < windowSize; i++) {
        cleanedArr[start + i] += cleanedChunk[i] * hann[i];
        weightSum[start + i] += hann[i];
      }
    }

    const remainderStart = n - windowSize;
    if (remainderStart > 0 && weightSum[remainderStart + windowSize - 1] < 1e-3) {
      const chunk = inArr.slice(remainderStart, remainderStart + windowSize);
      const cleanedChunk = denoiseWindow512(chunk, weights);
      for (let i = 0; i < windowSize; i++) {
        cleanedArr[remainderStart + i] += cleanedChunk[i] * hann[i];
        weightSum[remainderStart + i] += hann[i];
      }
    }

    for (let i = 0; i < n; i++) {
      cleanedArr[i] /= Math.max(weightSum[i], 1e-6);
    }
  }

  const elapsedMs = Math.round((performance.now() - t0) * 100) / 100;

  let sumRawSq = 0;
  let sumCleanSq = 0;
  let sumNoiseSq = 0;
  let maxRaw = 0;
  let maxClean = 0;

  const rawOut: number[] = new Array(n);
  const cleanOut: number[] = new Array(n);
  const noiseOut: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const r = inArr[i];
    const c = cleanedArr[i];
    const noise = r - c;

    rawOut[i] = Math.round(r * 10000) / 10000;
    cleanOut[i] = Math.round(c * 10000) / 10000;
    noiseOut[i] = Math.round(noise * 10000) / 10000;

    sumRawSq += r * r;
    sumCleanSq += c * c;
    sumNoiseSq += noise * noise;

    if (Math.abs(r) > maxRaw) maxRaw = Math.abs(r);
    if (Math.abs(c) > maxClean) maxClean = Math.abs(c);
  }

  const inRms = Math.sqrt(sumRawSq / n);
  const outRms = Math.sqrt(sumCleanSq / n);
  const noiseRms = Math.sqrt(sumNoiseSq / n);
  const noiseReductionPct = Math.round((1 - outRms / Math.max(inRms, 1e-6)) * 10000) / 100;

  return {
    status: 'success',
    model: 'EEG_1D_CNN_Denoiser',
    inference_latency_ms: elapsedMs,
    sampling_rate: 256,
    sample_count: n,
    raw_signal: rawOut,
    cleaned_signal: cleanOut,
    noise_signal: noiseOut,
    metrics: {
      input_rms: Math.round(inRms * 100) / 100,
      output_rms: Math.round(outRms * 100) / 100,
      noise_rms: Math.round(noiseRms * 100) / 100,
      input_peak: Math.round(maxRaw * 100) / 100,
      output_peak: Math.round(maxClean * 100) / 100,
      noise_reduction_pct: noiseReductionPct,
      has_clean_reference: false,
      reference_note: 'Ground truth clean reference not available in live recordings; reference-dependent metrics (MSE, true SNR improvement) omitted per scientific validity standards.'
    }
  };
}

