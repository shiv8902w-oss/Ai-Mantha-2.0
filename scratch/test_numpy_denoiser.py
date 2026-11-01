import json
import math
import time
import numpy as np
import torch

import sys
sys.path.insert(0, "EEG_BCI_Export")
from inference import EEGDenoiser

# 1. PyTorch reference
torch_denoiser = EEGDenoiser("EEG_BCI_Export/eeg_denoiser.pth")
demo_data = np.load("EEG_BCI_Export/demo_signal.npz")
noisy_sig = demo_data["noisy_signal"].astype(np.float32)

t0 = time.perf_counter()
torch_out = torch_denoiser.denoise(noisy_sig)
torch_time = (time.perf_counter() - t0) * 1000

print(f"PyTorch execution time: {torch_time:.2f} ms")

# 2. Pure NumPy implementation
weights_json = json.load(open("public/assets/denoiser_weights.json"))["weights"]

_v_erf = np.vectorize(math.erf, otypes=[np.float32])

def gelu(x):
    return 0.5 * x * (1.0 + _v_erf(x / 1.4142135623730951))

def conv1d(x, w, b, padding=0, dilation=1):
    # x: [C_in, L], w: [C_out, C_in, K], b: [C_out]
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
        # einsum over C_in: chunk [C_in, L] * w[:, :, i] [C_out, C_in] -> [C_out, L]
        out += np.matmul(w[:, :, i], chunk)
        
    if b is not None:
        out += b[:, None]
    return out

class NumpyEEGDenoisingCNN:
    def __init__(self, weights):
        self.w = {}
        for k, v in weights.items():
            if isinstance(v, dict) and 'data' in v:
                self.w[k] = np.array(v['data'], dtype=np.float32).reshape(v['shape'])
            else:
                self.w[k] = np.array(v, dtype=np.float32)
        
    def forward(self, x):
        # x: [1, 512]
        # input layer: kernel 9, padding 4
        h = conv1d(x, self.w['input_layer.weight'], self.w['input_layer.bias'], padding=4, dilation=1)
        
        # 6 residual blocks with dilations 1, 2, 4, 8, 1, 2
        dilations = [1, 2, 4, 8, 1, 2]
        for b_idx, dil in enumerate(dilations):
            res = h
            # conv1: padding 4 * dil, dilation = dil
            c1_w = self.w[f'blocks.{b_idx}.conv1.weight']
            c1_b = self.w[f'blocks.{b_idx}.conv1.bias']
            out1 = conv1d(h, c1_w, c1_b, padding=4 * dil, dilation=dil)
            act1 = gelu(out1)
            
            # conv2: padding 4, dilation = 1
            c2_w = self.w[f'blocks.{b_idx}.conv2.weight']
            c2_b = self.w[f'blocks.{b_idx}.conv2.bias']
            out2 = conv1d(act1, c2_w, c2_b, padding=4, dilation=1)
            h = gelu(out2 + res)
            
        # output layer: kernel 9, padding 4
        noise = conv1d(h, self.w['output_layer.weight'], self.w['output_layer.bias'], padding=4, dilation=1)
        return x - noise

    def denoise(self, raw_signal):
        signal = np.asarray(raw_signal, dtype=np.float32)
        scale = max(float(np.sqrt(np.mean(signal ** 2))), 1e-6)
        normalized = (signal / scale).reshape(1, 512)
        cleaned = self.forward(normalized) * scale
        return cleaned[0]

numpy_model = NumpyEEGDenoisingCNN(weights_json)

t0 = time.perf_counter()
numpy_out = numpy_model.denoise(noisy_sig)
numpy_time = (time.perf_counter() - t0) * 1000

print(f"NumPy execution time: {numpy_time:.2f} ms")
max_diff = np.max(np.abs(torch_out - numpy_out))
print(f"Max absolute difference between PyTorch and NumPy: {max_diff:.8f}")
assert max_diff < 1e-3, "Difference too large!"
print("SUCCESS: NumPy output matches PyTorch perfectly!")
