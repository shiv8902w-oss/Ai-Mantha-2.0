import json
import math
import os
import sys
import time
from http.server import BaseHTTPRequestHandler
import numpy as np

# Determine base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

EXPORT_DIR = os.path.join(BASE_DIR, "EEG_BCI_Export")
if EXPORT_DIR not in sys.path:
    sys.path.insert(0, EXPORT_DIR)

# Try loading PyTorch if available, else use lightweight NumPy engine
HAS_TORCH = False
torch_denoiser = None

try:
    import torch
    pth_path = os.path.join(EXPORT_DIR, "eeg_denoiser.pth")
    if not os.path.exists(pth_path):
        pth_path = os.path.join(BASE_DIR, "public", "assets", "eeg_denoiser.pth")
    if os.path.exists(pth_path):
        from inference import EEGDenoiser
        torch_denoiser = EEGDenoiser(model_path=pth_path)
        HAS_TORCH = True
except Exception as e:
    HAS_TORCH = False


# Lightweight Pure-NumPy Denoising CNN Engine (Vercel Serverless Ready)
_v_erf = np.vectorize(math.erf, otypes=[np.float32])

def gelu(x):
    return 0.5 * x * (1.0 + _v_erf(x / 1.4142135623730951))

def conv1d(x, w, b, padding=0, dilation=1):
    c_in, length = x.shape
    c_out, _, k = w.shape
    
    if padding > 0:
        x_pad = np.pad(x, ((0, 0), (padding, padding)), mode='constant')
    else:
        x_pad = x
        
    out_len = length
    out = np.zeros((c_out, out_len), dtype=np.float32)
    
    for i in range(k):
        shift = i * dilation
        chunk = x_pad[:, shift:shift + out_len]
        out += np.matmul(w[:, :, i], chunk)
        
    if b is not None:
        out += b[:, None]
    return out

class NumpyEEGDenoisingCNN:
    def __init__(self, weights_dict):
        self.w = {}
        for k, v in weights_dict.items():
            if isinstance(v, dict) and 'data' in v:
                self.w[k] = np.array(v['data'], dtype=np.float32).reshape(v['shape'])
            else:
                self.w[k] = np.array(v, dtype=np.float32)
                
    def forward(self, x):
        h = conv1d(x, self.w['input_layer.weight'], self.w['input_layer.bias'], padding=4, dilation=1)
        dilations = [1, 2, 4, 8, 1, 2]
        for b_idx, dil in enumerate(dilations):
            res = h
            c1_w = self.w[f'blocks.{b_idx}.conv1.weight']
            c1_b = self.w[f'blocks.{b_idx}.conv1.bias']
            out1 = conv1d(h, c1_w, c1_b, padding=4 * dil, dilation=dil)
            act1 = gelu(out1)
            
            c2_w = self.w[f'blocks.{b_idx}.conv2.weight']
            c2_b = self.w[f'blocks.{b_idx}.conv2.bias']
            out2 = conv1d(act1, c2_w, c2_b, padding=4, dilation=1)
            h = gelu(out2 + res)
            
        noise = conv1d(h, self.w['output_layer.weight'], self.w['output_layer.bias'], padding=4, dilation=1)
        return x - noise

    def denoise(self, raw_signal):
        signal = np.asarray(raw_signal, dtype=np.float32)
        scale = max(float(np.sqrt(np.mean(signal ** 2))), 1e-6)
        normalized = (signal / scale).reshape(1, 512)
        cleaned = self.forward(normalized) * scale
        return cleaned[0].astype(np.float32)

numpy_denoiser = None

def get_denoiser():
    global numpy_denoiser
    if HAS_TORCH and torch_denoiser is not None:
        return torch_denoiser
        
    if numpy_denoiser is None:
        weights_paths = [
            os.path.join(BASE_DIR, "public", "assets", "denoiser_weights.json"),
            os.path.join(os.getcwd(), "public", "assets", "denoiser_weights.json"),
            os.path.join(BASE_DIR, "dist", "assets", "denoiser_weights.json"),
        ]
        chosen_path = None
        for p in weights_paths:
            if os.path.exists(p):
                chosen_path = p
                break
                
        if not chosen_path:
            raise FileNotFoundError("Could not find denoiser_weights.json")
            
        with open(chosen_path, "r", encoding="utf-8") as f:
            w_json = json.load(f)["weights"]
        numpy_denoiser = NumpyEEGDenoisingCNN(w_json)
        
    return numpy_denoiser


def denoise_full_signal(signal_arr: np.ndarray) -> np.ndarray:
    denoiser = get_denoiser()
    n = len(signal_arr)
    if n == 512:
        return denoiser.denoise(signal_arr)
        
    if n < 512:
        pad_len = 512 - n
        padded = np.pad(signal_arr, (0, pad_len), mode='edge')
        cleaned_padded = denoiser.denoise(padded)
        return cleaned_padded[:n]
        
    cleaned = np.zeros(n, dtype=np.float32)
    weights = np.zeros(n, dtype=np.float32)
    step = 256
    window_size = 512
    hann = np.hanning(window_size).astype(np.float32)
    
    for start in range(0, n - window_size + 1, step):
        chunk = signal_arr[start:start + window_size]
        cleaned_chunk = denoiser.denoise(chunk)
        cleaned[start:start + window_size] += cleaned_chunk * hann
        weights[start:start + window_size] += hann
        
    remainder_start = n - window_size
    if remainder_start > 0 and weights[remainder_start + window_size - 1] < 1e-3:
        chunk = signal_arr[remainder_start:remainder_start + window_size]
        cleaned_chunk = denoiser.denoise(chunk)
        cleaned[remainder_start:remainder_start + window_size] += cleaned_chunk * hann
        weights[remainder_start:remainder_start + window_size] += hann
        
    weights = np.maximum(weights, 1e-6)
    return cleaned / weights


# Vercel Serverless Function Handler
class handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path.endswith("/health") or path == "/api/health" or path == "/health":
            resp = {
                "status": "online",
                "model": "EEG_1D_CNN_Denoiser",
                "weights": "denoiser_weights.json (Serverless)" if not HAS_TORCH else "eeg_denoiser.pth",
                "architecture": "6x Dilated Residual CNN (d=1,2,4,8,1,2)",
                "sampling_rate": 256,
                "window_size": 512,
                "device": "PyTorch CPU" if HAS_TORCH else "Vercel Optimized Serverless Engine",
                "cloud": "Vercel Serverless"
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(resp, indent=2).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": f"Route {path} not found"}).encode('utf-8'))

    def do_POST(self):
        path = self.path.split("?")[0]
        if path.endswith("/denoise") or path == "/api/denoise" or path == "/denoise":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                payload = json.loads(body)
                raw_signals = payload.get("signals")
                raw_signal = payload.get("signal")

                # BATCH MODE
                if raw_signals and isinstance(raw_signals, list):
                    t_start = time.perf_counter()
                    cleaned_batch = []
                    for s in raw_signals:
                        arr = np.array(s, dtype=np.float32)
                        cleaned_batch.append([round(float(v), 4) for v in denoise_full_signal(arr)])
                    t_end = time.perf_counter()
                    latency_ms = round((t_end - t_start) * 1000.0, 2)

                    resp = {
                        "status": "success",
                        "model": "EEG_1D_CNN_Denoiser",
                        "batch_count": len(cleaned_batch),
                        "total_latency_ms": latency_ms,
                        "avg_latency_ms": round(latency_ms / max(len(cleaned_batch), 1), 2),
                        "cleaned_signals": cleaned_batch
                    }
                    self._set_headers(200)
                    self.wfile.write(json.dumps(resp).encode('utf-8'))
                    return

                # SINGLE SIGNAL MODE
                if not raw_signal or not isinstance(raw_signal, list):
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "Missing or invalid 'signal' or 'signals' array"}).encode('utf-8'))
                    return

                signal_arr = np.array(raw_signal, dtype=np.float32)
                if not np.isfinite(signal_arr).all():
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "Signal contains NaN or Inf values"}).encode('utf-8'))
                    return

                t_start = time.perf_counter()
                cleaned_arr = denoise_full_signal(signal_arr)
                t_end = time.perf_counter()
                latency_ms = round((t_end - t_start) * 1000.0, 2)

                noise_arr = signal_arr - cleaned_arr

                input_rms = float(np.sqrt(np.mean(signal_arr ** 2)))
                output_rms = float(np.sqrt(np.mean(cleaned_arr ** 2)))
                noise_rms = float(np.sqrt(np.mean(noise_arr ** 2)))
                input_peak = float(np.max(np.abs(signal_arr)))
                output_peak = float(np.max(np.abs(cleaned_arr)))
                noise_reduction_pct = round(float((1.0 - (output_rms / max(input_rms, 1e-6))) * 100.0), 2)

                resp = {
                    "status": "success",
                    "model": "EEG_1D_CNN_Denoiser",
                    "inference_latency_ms": latency_ms,
                    "sampling_rate": 256,
                    "sample_count": len(signal_arr),
                    "raw_signal": [round(float(v), 4) for v in signal_arr],
                    "cleaned_signal": [round(float(v), 4) for v in cleaned_arr],
                    "noise_signal": [round(float(v), 4) for v in noise_arr],
                    "metrics": {
                        "input_rms": round(input_rms, 2),
                        "output_rms": round(output_rms, 2),
                        "noise_rms": round(noise_rms, 2),
                        "input_peak": round(input_peak, 2),
                        "output_peak": round(output_peak, 2),
                        "noise_reduction_pct": noise_reduction_pct,
                        "has_clean_reference": False,
                        "reference_note": "Ground truth clean reference not available in live recordings; reference-dependent metrics (MSE, true SNR improvement) omitted per scientific validity standards."
                    }
                }
                self._set_headers(200)
                self.wfile.write(json.dumps(resp).encode('utf-8'))

            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": f"Route {path} not found"}).encode('utf-8'))


if __name__ == "__main__":
    from http.server import HTTPServer
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5175
    print(f"[Vercel/Local API Server] Starting on http://0.0.0.0:{port}...")
    server = HTTPServer(("0.0.0.0", port), handler)
    print(f"[Vercel/Local API Server] Engine: {'PyTorch' if HAS_TORCH else 'NumPy Engine'}")
    print(f"[Vercel/Local API Server] Ready to receive /api/health and /api/denoise requests.")
    server.serve_forever()

