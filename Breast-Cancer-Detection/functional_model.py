from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from pydicom.pixel_data_handlers.util import apply_voi_lut
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import os
from PIL import Image
import pydicom
from sklearn.metrics import classification_report, confusion_matrix

# Data preparation
metadata_path = 'data/mass_case_description_train_set.csv'
dicom_root = 'data/ddsm_mass_train/manifest-1753769950093/CBIS-DDSM'
output_root = 'dataset/train'

os.makedirs(os.path.join(output_root, 'benign'), exist_ok=True)
os.makedirs(os.path.join(output_root, 'malignant'), exist_ok=True)

df = pd.read_csv(metadata_path)
df['folder_name'] = df['image file path'].apply(lambda x: x.split('/')[0].strip())
folder_pathology = df.groupby('folder_name')['pathology'].first().to_dict()

for folder_name, pathology in folder_pathology.items():
    folder_path = os.path.join(dicom_root, folder_name)
    if not os.path.isdir(folder_path):
        continue
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith('.dcm'):
                dicom_path = os.path.join(root, file)
                try:
                    dcm = pydicom.dcmread(dicom_path)
                    if 'PixelData' not in dcm:
                        continue
                    data = apply_voi_lut(dcm.pixel_array, dcm)
                    data = data.astype(np.float32)
                    data -= np.min(data)
                    data /= np.max(data)
                    data *= 255.0
                    img = Image.fromarray(data.astype(np.uint8)).convert('L')
                    rel_subpath = os.path.relpath(root, folder_path)
                    filename = f"{folder_name}_{rel_subpath.replace(os.sep, '_')}_{file}".replace(' ', '_').replace('.dcm', '.png')
                    save_dir = os.path.join(output_root, pathology)
                    img.save(os.path.join(save_dir, filename))
                except:
                    continue

# Load images
train_dir = 'dataset/train'
img_size = (224, 224)
batch_size = 8

datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)

train_gen = datagen.flow_from_directory(train_dir, target_size=img_size, batch_size=batch_size, class_mode='binary', subset='training')
val_gen = datagen.flow_from_directory(train_dir, target_size=img_size, batch_size=batch_size, class_mode='binary', subset='validation')

# Functional Model
inputs = Input(shape=(224, 224, 3), name="functional_input")
x = Conv2D(32, (3, 3), activation='relu')(inputs)
x = MaxPooling2D(2, 2)(x)
x = Conv2D(64, (3, 3), activation='relu')(x)
x = MaxPooling2D(2, 2)(x)
x = Conv2D(128, (3, 3), activation='relu')(x)
x = MaxPooling2D(2, 2)(x)
x = Flatten()(x)
x = Dropout(0.5)(x)
x = Dense(64, activation='relu')(x)
outputs = Dense(1, activation='sigmoid')(x)

model = Model(inputs, outputs, name="functional_cnn")

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model.summary()

print("Training samples:", train_gen.samples)
print("Validation samples:", val_gen.samples)

if train_gen.samples == 0:
    raise RuntimeError("❌ No training images found. Check your dataset folder.")

print("✅ Starting training...")


# Train
history = model.fit(train_gen, validation_data=val_gen, epochs=10)

# Plots
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train')
plt.plot(history.history['val_accuracy'], label='Val')
plt.title('Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train')
plt.plot(history.history['val_loss'], label='Val')
plt.title('Loss')
plt.legend()
plt.tight_layout()
plt.savefig("static/training_plot.png")
plt.close()

# Evaluation
val_gen.reset()
y_true = val_gen.classes
y_pred = model.predict(val_gen)
y_pred_labels = (y_pred > 0.5).astype(int).flatten()

print(classification_report(y_true, y_pred_labels, target_names=['Benign', 'Malignant']))

cm = confusion_matrix(y_true, y_pred_labels)
plt.figure(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Benign', 'Malignant'], yticklabels=['Benign', 'Malignant'])
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix')
plt.savefig("static/confusion_matrix.png")
plt.close()

# Save model
model.save("cnn_model_functional.h5")
print("✅ Functional model saved as cnn_model_functional.h5")
