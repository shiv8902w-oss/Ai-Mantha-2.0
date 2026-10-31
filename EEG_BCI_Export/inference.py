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