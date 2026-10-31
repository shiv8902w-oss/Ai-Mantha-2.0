import torch
import torch.nn as nn


class ResidualBlock(nn.Module):

    def __init__(self, channels, dilation=1):
        super().__init__()

        self.conv1 = nn.Conv1d(
            channels, channels,
            kernel_size=9,
            padding=4 * dilation,
            dilation=dilation
        )

        self.activation = nn.GELU()

        self.conv2 = nn.Conv1d(
            channels, channels,
            kernel_size=9,
            padding=4
        )

    def forward(self, x):

        residual = x

        out = self.conv1(x)
        out = self.activation(out)
        out = self.conv2(out)

        return self.activation(out + residual)


class EEGDenoisingCNN(nn.Module):

    def __init__(self):
        super().__init__()

        self.input_layer = nn.Conv1d(
            1, 32, kernel_size=9, padding=4
        )

        self.blocks = nn.Sequential(
            ResidualBlock(32, dilation=1),
            ResidualBlock(32, dilation=2),
            ResidualBlock(32, dilation=4),
            ResidualBlock(32, dilation=8),
            ResidualBlock(32, dilation=1),
            ResidualBlock(32, dilation=2)
        )

        self.output_layer = nn.Conv1d(
            32, 1, kernel_size=9, padding=4
        )

        nn.init.zeros_(self.output_layer.weight)
        nn.init.zeros_(self.output_layer.bias)

    def forward(self, x):

        features = self.input_layer(x)
        features = self.blocks(features)

        predicted_noise = self.output_layer(features)

        return x - predicted_noise