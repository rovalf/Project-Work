# app.py (clean)
from flask import (
    Flask, request, render_template, jsonify,
    redirect, url_for, session, send_file
)
import os, io, time, datetime as dt, logging
import numpy as np
from PIL import Image
import pydicom
from pydicom.pixel_data_handlers.util import apply_voi_lut
from werkzeug.security import generate_password_hash, check_password_hash

# Silence verbose TF logs before importing TF
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import load_model, Model
from tensorflow.keras import layers

try:
    import cv2
except Exception:
    cv2 = None  # Grad-CAM will be skipped if OpenCV is missing

# =============================================================================
# Flask setup
# =============================================================================
app = Flask(__name__, template_folder="frontend", static_folder="static")
app.secret_key = os.urandom(24)        # fresh each run => login required on restart
app.config["SESSION_PERMANENT"] = False
os.makedirs(app.static_folder, exist_ok=True)

USERS = {
    "admin": generate_password_hash("admin123"),
    "radiologist": generate_password_hash("rad456"),
}
def is_authed() -> bool:
    return "user" in session

# =============================================================================
# Utils
# =============================================================================
def _to_uint8(arr: np.ndarray) -> np.ndarray:
    arr = arr.astype(np.float32)
    mn, mx = float(arr.min()), float(arr.max())
    if mx <= mn:
        return np.zeros_like(arr, dtype=np.uint8)
    arr = (arr - mn) / (mx - mn) * 255.0
    return arr.astype(np.uint8)

# Patch for Keras3→TF2.x DepthwiseConv2D config ('groups' key)
class PatchedDepthwiseConv2D(tf.keras.layers.DepthwiseConv2D):
    @classmethod
    def from_config(cls, config):
        config.pop("groups", None)
        return super().from_config(config)

# Safe replacement for any brightness Lambda used at train time
class BrightnessJitter(layers.Layer):
    def __init__(self, strength=0.05, **kwargs):
        super().__init__(**kwargs)
        self.strength = float(strength)

    def call(self, x, training=None):
        if training:
            delta = tf.random.uniform((), -self.strength, self.strength)
            return tf.clip_by_value(tf.image.adjust_brightness(x, delta), 0.0, 1.0)
        return x

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"strength": self.strength})
        return cfg

# =============================================================================

MODEL_PATH = os.environ.get("MODEL_PATH", "models/mammo_effnetb2.keras")

def _infer_backbone_size(path: str):
    p = path.lower()
    if "b0" in p: return "B0", (224, 224)
    if "b3" in p: return "B3", (300, 300)
    return "B2", (260, 260)

BACKBONE, DEFAULT_INPUT = _infer_backbone_size(MODEL_PATH)

_loaded_model = None
_input_size = DEFAULT_INPUT

def _build_inference_graph(backbone: str, img_size):
    if backbone == "B0":
        base = keras.applications.EfficientNetB0(include_top=False, weights="imagenet",
                                                 input_shape=(img_size[0], img_size[1], 3),
                                                 pooling="avg")
    elif backbone == "B3":
        base = keras.applications.EfficientNetB3(include_top=False, weights="imagenet",
                                                 input_shape=(img_size[0], img_size[1], 3),
                                                 pooling="avg")
    else:
        base = keras.applications.EfficientNetB2(include_top=False, weights="imagenet",
                                                 input_shape=(img_size[0], img_size[1], 3),
                                                 pooling="avg")
    inp = keras.Input(shape=(img_size[0], img_size[1], 3), name="inference_input")
    x = base(inp, training=False)
    x = layers.Dropout(0.4, name="dropout")(x)
    out = layers.Dense(1, activation="sigmoid", name="dense")(x)
    return keras.Model(inp, out, name=f"effnet_{backbone.lower()}_classifier_infer")

def _try_load_native_or_legacy():
    """
    1) Native .keras (best)
    2) .h5 safe_mode=True (with custom_objects)
    3) .h5 safe_mode=False (if a Python lambda slipped in)
    """
    last_err = None
    abspath = os.path.abspath(MODEL_PATH)
    print(f"[Model] Attempting load from: {abspath}")

    # Native
    if MODEL_PATH.lower().endswith(".keras"):
        try:
            m = keras.models.load_model(
                MODEL_PATH, compile=False,
                custom_objects={
                    "DepthwiseConv2D": PatchedDepthwiseConv2D,
                    "BrightnessJitter": BrightnessJitter,
                }
            )
            return m, (int(m.inputs[0].shape[1]), int(m.inputs[0].shape[2]))
        except Exception as e:
            last_err = e
            print(f"[Model] .keras load failed: {e}")

    # H5: safe_mode=True
    if MODEL_PATH.lower().endswith(".h5"):
        try:
            m = load_model(
                MODEL_PATH, compile=False, safe_mode=True,
                custom_objects={
                    "DepthwiseConv2D": PatchedDepthwiseConv2D,
                    "BrightnessJitter": BrightnessJitter,
                }
            )
            return m, (int(m.inputs[0].shape[1]), int(m.inputs[0].shape[2]))
        except Exception as e:
            last_err = e
            print(f"[Model] .h5 safe_mode=True failed: {e}")

        # H5: safe_mode=False (only if you trust the file)
        try:
            m = load_model(
                MODEL_PATH, compile=False, safe_mode=False,
                custom_objects={"DepthwiseConv2D": PatchedDepthwiseConv2D}
            )
            return m, (int(m.inputs[0].shape[1]), int(m.inputs[0].shape[2]))
        except Exception as e:
            last_err = e
            print(f"[Model] .h5 safe_mode=False failed: {e}")

    raise last_err if last_err else RuntimeError("No compatible model format found")

def get_model():
    """
    Lazy-load the model. If full deserialization fails, rebuild a compatible
    inference graph and load weights by name with skip_mismatch=True.
    """
    global _loaded_model, _input_size
    if _loaded_model is not None:
        return _loaded_model

    t0 = time.time()
    try:
        m, size = _try_load_native_or_legacy()
        _loaded_model, _input_size = m, size
        print(f"[Model] Loaded in {time.time()-t0:.2f}s @ input {_input_size}")
        return _loaded_model
    except Exception as e:
        print(f"[Model] Deserialization failed; fallback to rebuild: {e}")

    m = _build_inference_graph(BACKBONE, DEFAULT_INPUT)
    try:
        m.load_weights(MODEL_PATH, by_name=True, skip_mismatch=True)
        print("[Model] Weights loaded by name (skip_mismatch=True)")
    except Exception as e2:
        print(f"[Model] load_weights by name failed: {e2}")
        try:
            m.load_weights(MODEL_PATH)
            print("[Model] Weights loaded strictly")
        except Exception as e3:
            print(f"[Model] Strict load_weights failed: {e3}")
    _loaded_model, _input_size = m, DEFAULT_INPUT
    print(f"[Model] Ready (fallback) in {time.time()-t0:.2f}s @ input {_input_size}")
    return _loaded_model

def _preprocess_pil(pil_img: Image.Image):
    w, h = _input_size
    pil_img = pil_img.convert("RGB").resize((w, h))
    arr = np.asarray(pil_img).astype("float32") / 255.0
    return np.expand_dims(arr, axis=0)

# ========== Grad-CAM (joint, graph-safe) ==========

def _get_effnet_base(model):
    for name in ("efficientnetb0", "efficientnetb2", "efficientnetb3"):
        try:
            return model.get_layer(name)
        except Exception:
            pass
    for lyr in model.layers:
        if isinstance(lyr, tf.keras.Model) and "efficientnet" in lyr.name.lower():
            return lyr
    return None

def _copy_weights_by_name(src_model, dst_model):
    src = {l.name: l for l in src_model.layers}
    copied = skipped = 0
    for dl in dst_model.layers:
        sl = src.get(dl.name)
        if sl and sl.weights and dl.weights:
            try:
                dl.set_weights(sl.get_weights())
                copied += 1
            except Exception:
                skipped += 1
        else:
            skipped += 1
    return copied, skipped

def _build_joint_gradcam_model(model, img_size):
    """
    Build a single graph that maps model.input -> (conv_maps, prediction),
    where conv_maps come from a feature extractor that shares weights
    with your trained EfficientNet backbone, and 'prediction' is produced
    by your existing head (dropout + dense).
    """
    base_src = _get_effnet_base(model)
    if base_src is None:
        return None, "EfficientNet base not found in classifier"

    feat = tf.keras.applications.EfficientNetB2(
        include_top=False, weights=None,
        input_shape=(img_size[0], img_size[1], 3),
        pooling=None  # expose conv map
    )
    copied, skipped = _copy_weights_by_name(base_src, feat)
    try:
        app.logger.info(f"[GradCAM] weight copy: copied={copied}, skipped={skipped}")
    except Exception:
        print(f"[GradCAM] weight copy: copied={copied}, skipped={skipped}", flush=True)

    conv_maps = feat(model.input, training=False)  # shape ~ (1, h, w, c)

    try:
        head_dropout = model.get_layer("dropout") 
        head_dense   = model.get_layer("output")   # final Dense(1, sigmoid)
    except Exception as e:
        return None, f"Missing head layers: {e}"

    gap = tf.keras.layers.GlobalAveragePooling2D(name="gradcam_gap")(conv_maps)
    logits = head_dense(head_dropout(gap, training=False))  # reuse same weights

    joint = tf.keras.Model(inputs=model.input, outputs=[conv_maps, logits], name="gradcam_joint")
    return joint, None

def save_gradcam(model, input_png_path, output_png_path):
    if cv2 is None:
        return False, "OpenCV (cv2) not installed"
    
    img = Image.open(input_png_path).convert("RGB").resize(_input_size)
    x = np.expand_dims(np.asarray(img).astype("float32") / 255.0, axis=0)
    xt = tf.convert_to_tensor(x)

    joint, err = _build_joint_gradcam_model(model, _input_size)
    if joint is None:
        return False, f"Grad-CAM setup failed: {err}"

    # dry check (zeros) to prove connectivity and shapes
    try:
        z_conv, z_pred = joint(np.zeros_like(x), training=False)
        zc, zp = np.asarray(z_conv).shape, np.asarray(z_pred).shape
        try:
            app.logger.info(f"[GradCAM][diag] joint OK | conv={zc} pred={zp}")
        except Exception:
            print(f"[GradCAM][diag] joint OK | conv={zc} pred={zp}", flush=True)
    except Exception as e:
        return False, f"[GradCAM][diag] Functional.call failed: {e}"

    # real pass + gradients
    with tf.GradientTape() as tape:
        conv_out, preds = joint(xt, training=False)
        # binary head (Dense(1, sigmoid))
        target = preds[:, 0] if preds.shape[-1] == 1 else preds[:, tf.argmax(preds[0])]

    grads = tape.gradient(target, conv_out)[0]   # (Hc, Wc, C)
    fmap  = conv_out[0]                          # (Hc, Wc, C)

    grads = np.asarray(grads)
    fmap  = np.asarray(fmap)

    weights = grads.mean(axis=(0, 1))            # (C,)
    cam = (fmap * weights).sum(axis=-1)          # (Hc, Wc)
    cam = np.maximum(cam, 0)
    cam = cam / (cam.max() + 1e-8)
    cam = cv2.resize(cam.astype(np.float32), _input_size)

    heat = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    blend = cv2.addWeighted(np.array(img), 0.6, heat, 0.4, 0)

    Image.fromarray(blend).save(output_png_path)
    return True, None

# =============================================================================
# Routes
# =============================================================================
@app.route("/", methods=["GET"])
def home():
    return redirect(url_for("login")) if not is_authed() else redirect(url_for("dashboard"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = request.form.get("username", "").strip()
        pwd  = request.form.get("password", "")
        if user in USERS and check_password_hash(USERS[user], pwd):
            session["user"] = user
            return redirect(url_for("dashboard"))
        return render_template("login.html", error="Invalid credentials")
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

@app.route("/dashboard", methods=["GET"])
def dashboard():
    if not is_authed():
        return redirect(url_for("login"))
    return render_template("index.html")

# ---- Convert: DICOM → PNG (download) ----
@app.route("/convert_download", methods=["POST"])
def convert_download():
    if not is_authed():
        return redirect(url_for("login"))
    file = request.files.get("dicom_file")
    if not file or file.filename == "":
        return "No DICOM uploaded", 400
    try:
        dcm = pydicom.dcmread(file, force=True)
        if "PixelData" not in dcm:
            return "Invalid DICOM: missing PixelData", 400
        px = apply_voi_lut(dcm.pixel_array, dcm)
        if getattr(dcm, "PhotometricInterpretation", "MONOCHROME2") == "MONOCHROME1":
            px = px.max() - px
        img = Image.fromarray(_to_uint8(px)).convert("L")
        buf = io.BytesIO()
        img.save(buf, format="PNG"); buf.seek(0)
        pid = getattr(dcm, "PatientID", "anon")
        ts = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
        return send_file(buf, mimetype="image/png", as_attachment=True,
                         download_name=f"{pid}_{ts}.png")
    except Exception as e:
        return f"Conversion failed: {e}", 500

# ---- Predict (PNG/JPG upload) ----
@app.route("/predict", methods=["POST"])
def predict():
    if not is_authed():
        return jsonify({"error": "Please log in to use prediction."}), 401
    if "file" not in request.files or request.files["file"].filename == "":
        return jsonify({"error": "No file uploaded"}), 400

    try:
        model = get_model()  # lazy load
        pil = Image.open(request.files["file"].stream).convert("RGB")
        x = _preprocess_pil(pil)

        prob = float(model.predict(x, verbose=0).reshape(-1)[0])
        label = "Malignant" if prob > 0.5 else "Benign"
        conf  = prob if prob > 0.5 else 1 - prob

        # Save preview & Grad-CAM
        last_png = os.path.join(app.static_folder, "last_uploaded.png")
        pil.resize(_input_size).save(last_png)
        grad_png = os.path.join(app.static_folder, "gradcam.png")
        ok, gerr = save_gradcam(model, last_png, grad_png)
        grad_url = url_for("static", filename="gradcam.png") if ok else None
        if not ok and gerr:
            print(f"[GradCAM] skipped: {gerr}")

        return jsonify({
            "prediction": label,
            "confidence": f"{conf * 100:.2f}%",
            "image_path": url_for("static", filename="last_uploaded.png"),
            "gradcam_image": grad_url
        })
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

@app.route("/evaluation", methods=["GET"])
def evaluation():
    if not is_authed():
        return redirect(url_for("login"))
    return render_template("evaluation.html")

if __name__ == "__main__":
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    print(f"[App] MODEL_PATH={MODEL_PATH} | backbone={BACKBONE} | default_input={DEFAULT_INPUT}")
    app.run(debug=True)
