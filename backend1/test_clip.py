import os
import torch
import numpy as np
from PIL import Image
import clip

device = 'cpu'
model, preprocess = clip.load('ViT-B/32', device=device)

# ← change this to actual strawberry image path
img_path = r'D:\reserach bacup\Smart_cement_Y4\backend1\test_strawberry.png'

if not os.path.exists(img_path):
    print(f"Warning: test image not found at {img_path}. Creating a placeholder image.")
    placeholder = Image.new('RGB', (224, 224), color=(255, 255, 255))
    try:
        placeholder.save(img_path)
        print(f"Placeholder saved to {img_path}")
    except Exception as e:
        print("Could not save placeholder image:", e)
        raise

image = preprocess(Image.open(img_path).convert('RGB')).unsqueeze(0)

micro_prompts = [
    'a cement clinker microscopy image showing crystalline phases',
    'a BSE or SEM microscopy image of cement clinker',
    'an optical microscope image of cement clinker mineral phases',
]
other_prompts = [
    'a photograph of a person animal food or cartoon character',
    'a regular photo taken with a phone or camera',
    'a cartoon illustration or computer generated image',
]

micro_tokens = clip.tokenize(micro_prompts)
other_tokens = clip.tokenize(other_prompts)

with torch.no_grad():
    img_f   = model.encode_image(image)
    micro_f = model.encode_text(micro_tokens)
    other_f = model.encode_text(other_tokens)
    img_f   = img_f   / img_f.norm(dim=-1, keepdim=True)
    micro_f = micro_f / micro_f.norm(dim=-1, keepdim=True)
    other_f = other_f / other_f.norm(dim=-1, keepdim=True)
    micro_scores = (img_f @ micro_f.T).squeeze().numpy()
    other_scores = (img_f @ other_f.T).squeeze().numpy()

print('Micro scores:', micro_scores)
print('Other scores:', other_scores)
print('Max micro:', max(micro_scores))
print('Max other:', max(other_scores))
print('Decision:', 'PASS' if max(micro_scores) > max(other_scores) else 'REJECT')