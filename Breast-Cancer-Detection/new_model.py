import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# ==========================
# Config
# ==========================
DATA_ROOT   = "dataset/train"         # expects dataset/train/{benign,malignant}
CLASS_NAMES = ["benign", "malignant"] # 0=benign, 1=malignant
IMG_SIZE    = (260, 260)              # EfficientNetB2 default
BATCH_SIZE  = 8
EPOCHS      = 10                      # adjust as needed
SEED        = 42

os.makedirs("models", exist_ok=True)
np.random.seed(SEED); tf.random.set_seed(SEED)

# ==========================
# Dataset loaders
# ==========================
def decode_img(path, label):
    img_bytes = tf.io.read_file(path)
    img = tf.io.decode_image(img_bytes, channels=3, expand_animations=False)
    img = tf.image.resize(img, IMG_SIZE, antialias=True)
    img = tf.image.convert_image_dtype(img, tf.float32)  # scale [0,1]
    return img, tf.cast(label, tf.int32)

def make_dataset(filepaths, labels, training=False):
    ds = tf.data.Dataset.from_tensor_slices((filepaths, labels))
    ds = ds.map(decode_img, num_parallel_calls=tf.data.AUTOTUNE)
    if training:
        ds = ds.shuffle(buffer_size=len(filepaths), seed=SEED)
        aug = keras.Sequential([
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.05),
            layers.RandomContrast(0.1),
        ])
        ds = ds.map(lambda x, y: (aug(x, training=True), y),
                    num_parallel_calls=tf.data.AUTOTUNE)
    return ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

def list_images(root, cls):
    folder = os.path.join(root, cls)
    if not os.path.isdir(folder):
        return []
    return [os.path.join(folder, f) for f in os.listdir(folder)
            if f.lower().endswith((".png", ".jpg", ".jpeg"))]

# Gather file paths
paths, labels = [], []
for i, cls in enumerate(CLASS_NAMES):
    imgs = list_images(DATA_ROOT, cls)
    paths.extend(imgs)
    labels.extend([i] * len(imgs))

paths = np.array(paths); labels = np.array(labels)
n_total = len(paths)
n_val   = max(1, int(0.2 * n_total))  # 20% validation

# Split train/val
idx = np.arange(n_total)
np.random.shuffle(idx)
train_idx, val_idx = idx[n_val:], idx[:n_val]

train_ds = make_dataset(paths[train_idx], labels[train_idx], training=True)
val_ds   = make_dataset(paths[val_idx], labels[val_idx], training=False)

# ==========================
# Model
# ==========================
def build_model():
    base = keras.applications.EfficientNetB2(
        include_top=False,
        weights=None,  # start from scratch to avoid weight mismatch issues
        input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3),
        pooling="avg"
    )
    inputs = keras.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3), name="input_rgb")
    x = base(inputs, training=True)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(1, activation="sigmoid", name="output")(x)
    return keras.Model(inputs, outputs, name="mammo_effnetb2")

model = build_model()

model.compile(
    optimizer=keras.optimizers.Adam(1e-4),
    loss="binary_crossentropy",
    metrics=["accuracy", keras.metrics.AUC(name="auc"), keras.metrics.AUC(name="prc", curve="PR")]
)

# ==========================
# Training
# ==========================
ckpt_path = "models/mammo_effnetb2.keras"
callbacks = [
    keras.callbacks.ModelCheckpoint(ckpt_path, monitor="val_auc",
                                    mode="max", save_best_only=True, verbose=1),
    keras.callbacks.EarlyStopping(monitor="val_auc", mode="max",
                                  patience=3, restore_best_weights=True)
]

print("== Training EfficientNetB2 ==")
history = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS,
                    callbacks=callbacks, verbose=2)

# Final save
model.save(ckpt_path)
print(f"✅ Saved model at {ckpt_path}")
