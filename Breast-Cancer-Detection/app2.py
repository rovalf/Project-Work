from flask import Flask, request, render_template, jsonify
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Input
from PIL import Image
import numpy as np
import os
import cv2
from pydicom import dcmread
from pydicom.pixel_data_handlers.util import apply_voi_lut
import tensorflow as tf

app = Flask(__name__, template_folder="frontend")
model = load_model("models/effb0_fold2.h5")  

# Grad-CAM++ logic
def generate_gradcam_plus_plus(model, input_path, output_path):
    img = Image.open(input_path).convert("RGB").resize((224, 224))
    img_array = np.array(img) / 255.0
    img_tensor = tf.convert_to_tensor(np.expand_dims(img_array, axis=0), dtype=tf.float32)

    # Identify last conv layer
    last_conv_layer = None
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            last_conv_layer = layer
            break
    if last_conv_layer is None:
        raise ValueError("No Conv2D layer found in the model.")

    grad_model = Model(inputs=model.input, outputs=[last_conv_layer.output, model.output])

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_tensor)
        class_idx = tf.argmax(predictions[0])
        loss = predictions[:, class_idx]

    grads = tape.gradient(loss, conv_outputs)[0]
    conv_outputs = conv_outputs[0]
    weights = tf.reduce_mean(grads, axis=(0, 1))

    cam = np.zeros(conv_outputs.shape[0:2], dtype=np.float32)
    for i, w in enumerate(weights):
        cam += w * conv_outputs[:, :, i]

    cam = np.maximum(cam, 0)
    cam = cam / cam.max()
    cam = cv2.resize(cam, (224, 224))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    superimposed_img = cv2.addWeighted(np.array(img), 0.6, heatmap, 0.4, 0)

    Image.fromarray(superimposed_img).save(output_path)

# Image preprocessing
def preprocess_image(image):
    image = image.resize((224, 224)).convert("RGB")
    img_array = np.array(image) / 255.0
    return np.expand_dims(img_array, axis=0)

@app.route("/", methods=["GET", "POST"])
def index():
    png_preview = None
    if request.method == "POST" and "dicom_convert" in request.form:
        dicom_file = request.files.get("dicom_file")
        if dicom_file:
            dcm = dcmread(dicom_file)
            if "PixelData" in dcm:
                data = apply_voi_lut(dcm.pixel_array, dcm)
                data = data.astype(np.float32)
                data -= data.min()
                data /= data.max()
                data *= 255.0
                img = Image.fromarray(data.astype(np.uint8)).convert("L")
                png_path = os.path.join("static", "converted.png")
                img.save(png_path)
                png_preview = png_path
    return render_template("index.html", png_preview=png_preview)

@app.route("/evaluation")
def evaluation():
    return render_template("evaluation.html")

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    image = Image.open(file.stream).convert("RGB").resize((224, 224))
    processed = preprocess_image(image)

    prediction = model.predict(processed)[0][0]
    label = "Malignant" if prediction > 0.5 else "Benign"
    confidence = prediction if prediction > 0.5 else 1 - prediction

    temp_path = os.path.join("static", "last_uploaded.png")
    image.save(temp_path)

    gradcam_path = os.path.join("static", "gradcam_output.png")
    generate_gradcam_plus_plus(model, temp_path, gradcam_path)

    return jsonify({
        "prediction": label,
        "confidence": f"{confidence * 100:.2f}%",
        "image_path": temp_path,
        "gradcam_image": gradcam_path
    })

if __name__ == "__main__":
    app.run(debug=True)
