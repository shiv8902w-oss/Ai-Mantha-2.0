import numpy as np
import torch

from eeg_denoiser.model import EEGDenoisingCNN


class EEGDenoiser:

    def __init__(self, model_path="eeg_denoiser.pth", device=None):

        self.device = torch.device(
            device or ("cuda" if torch.cuda.is_available() else "cpu")
        )

        self.model = EEGDenoisingCNN().to(self.device)

        state = torch.load(
            model_path,
            map_location=self.device,
            weights_only=True
        )

        self.model.load_state_dict(state)
        self.model.eval()

    def denoise(self, raw_signal):

        signal = np.asarray(raw_signal, dtype=np.float32)

        if signal.shape != (512,):
            raise ValueError("Expected exactly 512 samples.")

        if not np.isfinite(signal).all():
            raise ValueError("Signal contains invalid values.")

        scale = max(
            float(np.sqrt(np.mean(signal ** 2))),
            1e-6
        )

        normalized = signal / scale

        tensor = torch.from_numpy(
            normalized
        ).reshape(1, 1, 512).to(self.device)

        with torch.inference_mode():
            output = self.model(tensor)

        cleaned = output.cpu().numpy()[0, 0] * scale

        return cleaned.astype(np.float32)


if __name__ == "__main__":
    import os
    import time

    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "eeg_denoiser.pth")
    demo_data_path = os.path.join(base_dir, "demo_signal.npz")

    print("=" * 60)
    print("  NEUROSYNC // EEG-1D-CNN DENOISER INFERENCE RUNNER")
    print("=" * 60)

    print(f"\n[1/3] Loading PyTorch model from: {os.path.basename(model_path)}")
    denoiser = EEGDenoiser(model_path=model_path)
    print(f"      Target Device: {denoiser.device}")

    print(f"\n[2/3] Loading sample EEG signal from: {os.path.basename(demo_data_path)}")
    data = np.load(demo_data_path)
    noisy_sig = data["noisy_signal"]
    sr = int(data.get("sampling_rate", 256))
    print(f"      Signal samples : {len(noisy_sig)} samples ({len(noisy_sig) / sr:.1f}s @ {sr}Hz)")

    print("\n[3/3] Running 1D-CNN Denoising Forward Pass...")
    t0 = time.perf_counter()
    cleaned_sig = denoiser.denoise(noisy_sig)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    in_rms = float(np.sqrt(np.mean(noisy_sig ** 2)))
    out_rms = float(np.sqrt(np.mean(cleaned_sig ** 2)))
    noise_reduction = (1.0 - (out_rms / max(in_rms, 1e-6))) * 100.0

    print("\n" + "-" * 60)
    print("  INFERENCE RESULTS SUMMARY")
    print("-" * 60)
    print(f"  Inference Latency   : {elapsed_ms:.2f} ms")
    print(f"  Input RMS Amplitude : {in_rms:.3f} µV")
    print(f"  Cleaned EEG RMS     : {out_rms:.3f} µV")
    print(f"  Artifact Reduction  : {noise_reduction:.1f}%")
    print(f"  Cleaned Array Shape : {cleaned_sig.shape}")
    print(f"  First 5 Denoised Samples: {cleaned_sig[:5].tolist()}")
    print("-" * 60)
    print("[SUCCESS] Model inference completed successfully!\n")
