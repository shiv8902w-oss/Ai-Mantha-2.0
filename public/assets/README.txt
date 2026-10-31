EEG DENOISING MODEL — TEAM HANDOFF

1. MODEL
   eeg_denoiser.pth contains the trained PyTorch model weights.

2. ARCHITECTURE
   eeg_denoiser/model.py contains the exact CNN architecture.

3. INPUT REQUIREMENTS
   - Single EEG channel
   - 256 Hz sampling rate
   - Exactly 512 consecutive samples per window
   - Two seconds per window

4. OUTPUT
   - 512 cleaned EEG samples

5. QUICK USAGE

   from inference import EEGDenoiser

   denoiser = EEGDenoiser("eeg_denoiser.pth")

   cleaned_signal = denoiser.denoise(your_512_sample_signal)

6. IMPORTANT
   This model was trained using synthetic EOG-contaminated EEG.
   It is not a motor-imagery classifier and has not been validated
   on live BioAmp recordings.

7. DEMO
   demo_signal.npz contains an example noisy signal and its
   corresponding model output.

8. TEST RESULTS
   test_results.csv contains the held-out test measurements.