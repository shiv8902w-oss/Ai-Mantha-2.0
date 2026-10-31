import sys
import os
import json
import time
import numpy as np
import torch
from http.server import HTTPServer, BaseHTTPRequestHandler

# Add EEG_BCI_Export to sys.path so we can import inference directly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORT_DIR = os.path.join(BASE_DIR, "EEG_BCI_Export")
if EXPORT_DIR not in sys.path:
    sys.path.insert(0, EXPORT_DIR)

from inference import EEGDenoiser

MODEL_WEIGHTS_PATH = os.path.join(EXPORT_DIR, "eeg_denoiser.pth")
if not os.path.exists(MODEL_WEIGHTS_PATH):
    # fallback to public/assets
    MODEL_WEIGHTS_PATH = os.path.join(BASE_DIR, "public", "assets", "eeg_denoiser.pth")

print(f"[Denoiser Server] Loading trained model weights from: {MODEL_WEIGHTS_PATH}")
denoiser = EEGDenoiser(model_path=MODEL_WEIGHTS_PATH)
print("[Denoiser Server] PyTorch EEGDenoisingCNN model loaded and ready in eval mode.")

def denoise_full_signal(signal_arr: np.ndarray) -> np.ndarray:
    """
    Denoises a 1D EEG signal using the trained EEG_1D_CNN_Denoiser.
    If signal is exactly 512 samples, runs a single forward pass.
    If longer than 512 samples, processes in consecutive 512-sample windows.
    If shorter, pads symmetrically to 512 samples, denoises, and unpads.
    """
    n = len(signal_arr)
    if n == 512:
        return denoiser.denoise(signal_arr)
    
    if n < 512:
        pad_len = 512 - n
        padded = np.pad(signal_arr, (0, pad_len), mode='edge')
        cleaned_padded = denoiser.denoise(padded)
        return cleaned_padded[:n]
    
    # For multi-window signals (e.g. 1024, 2048 samples)
    cleaned = np.zeros(n, dtype=np.float32)
    weights = np.zeros(n, dtype=np.float32)
    step = 256 # 50% overlap for smooth reconstruction
    window_size = 512
    hann = np.hanning(window_size).astype(np.float32)
    
    for start in range(0, n - window_size + 1, step):
        chunk = signal_arr[start:start + window_size]
        cleaned_chunk = denoiser.denoise(chunk)
        cleaned[start:start + window_size] += cleaned_chunk * hann
        weights[start:start + window_size] += hann
        
    # Remainder if not evenly divisible
    remainder_start = n - window_size
    if remainder_start > 0 and weights[remainder_start + window_size - 1] < 1e-3:
        chunk = signal_arr[remainder_start:remainder_start + window_size]
        cleaned_chunk = denoiser.denoise(chunk)
        cleaned[remainder_start:remainder_start + window_size] += cleaned_chunk * hann
        weights[remainder_start:remainder_start + window_size] += hann

    # Normalize overlapping regions
    weights = np.maximum(weights, 1e-6)
    cleaned = cleaned / weights
    return cleaned

class DenoiserHandler(BaseHTTPRequestHandler):
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
        if self.path == "/api/health" or self.path == "/health":
            resp = {
                "status": "online",
                "model": "EEG_1D_CNN_Denoiser",
                "weights": "eeg_denoiser.pth",
                "architecture": "6x Dilated Residual CNN (d=1,2,4,8,1,2)",
                "sampling_rate": 256,
                "window_size": 512,
                "device": str(denoiser.device)
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(resp, indent=2).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))

    def do_POST(self):
        if self.path == "/api/denoise":
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
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))

def run_server(port=5175):
    server = HTTPServer(("0.0.0.0", port), DenoiserHandler)
    print(f"[Denoiser Server] Listening on http://0.0.0.0:{port}")
    server.serve_forever()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5175
    run_server(port)
