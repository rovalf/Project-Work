import os
import numpy as np
from tensorflow import keras

MODEL_PATH = "models/mammo_effnetb2.keras"

print(f"🔎 Checking model at: {MODEL_PATH}")

# Try to load the model
try:
    model = keras.models.load_model(MODEL_PATH, compile=False)
    print("✅ Model loaded successfully!")
except Exception as e:
    print("❌ Failed to load model:", e)
    exit(1)

# Print input & output info
print("Input shape:", model.inputs[0].shape)
print("Output shape:", model.outputs[0].shape)

# Create a dummy image (all zeros) with correct shape
dummy = np.zeros((1, 260, 260, 3), dtype="float32")
pred = model.predict(dummy, verbose=0)

print("Prediction output:", pred)
print("Output shape from predict:", pred.shape)

# Check that it is a probability between 0 and 1
if pred.shape == (1,1) and 0.0 <= float(pred[0][0]) <= 1.0:
    print("✅ Prediction output is valid (probability in [0,1])")
else:
    print("⚠️ Prediction output unexpected:", pred)
