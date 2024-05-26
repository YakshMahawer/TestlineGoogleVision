from flask import Flask, request, render_template, jsonify
from google.cloud import vision
from google.cloud.vision_v1 import types
from PIL import Image, ImageDraw
import base64
import io
import os

app = Flask(__name__)

# Setting Up GOogle Vision API
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'google-vision.json'
client = vision.ImageAnnotatorClient()

# Function to extract the text from the given image 
def extract_text(image_content, output_text_path):
    image = types.Image(content=image_content)

    response = client.text_detection(image=image)
    texts = response.text_annotations

    if response.error.message:
        raise Exception(f'{response.error.message}')
    
    with open(output_text_path, 'w') as text_file:
        text_file.write(texts[0].description)
    
    return texts

#Removing the text from orignal image
def remove_text_from_image(image_content, output_image_path, output_text_path):
    texts = extract_text(image_content, output_text_path)
    
    with Image.open(io.BytesIO(image_content)) as image:
        draw = ImageDraw.Draw(image)

        for text in texts[1:]:
            vertices = [(vertex.x, vertex.y) for vertex in text.bounding_poly.vertices]
            x_min = min(vertices, key=lambda v: v[0])[0]
            y_min = min(vertices, key=lambda v: v[1])[1]
            x_max = max(vertices, key=lambda v: v[0])[0]
            y_max = max(vertices, key=lambda v: v[1])[1]

            draw.rectangle([x_min, y_min, x_max, y_max], fill=(255, 255, 255))
        
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        buffered.seek(0)
        img_str = base64.b64encode(buffered.getvalue()).decode()

    return img_str, buffered.getvalue()

#Getting the information about the image that we got after removing text from it
def get_image_info(image_content):
    image = types.Image(content=image_content)
    response = client.label_detection(image=image)
    labels = response.label_annotations

    web_detection = client.web_detection(image=image).web_detection

    label_descriptions = [label.description for label in labels]
    web_entities = [entity.description for entity in web_detection.web_entities if entity.description]

    return label_descriptions, web_entities

#Rendering HTML page
@app.route('/')
def index():
    return render_template('index.html')

#Handling Upload POST Request
@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['image']
    image_content = file.read()
    original_img_str = base64.b64encode(image_content).decode()
    output_text_path = 'text.txt'
    img_str, processed_image_content = remove_text_from_image(image_content, None, output_text_path)
    
    with open(output_text_path, 'r') as text_file:
        text_content = text_file.read()
    labels, web_entities = get_image_info(processed_image_content)
    print(labels)
    print(web_entities)
    return jsonify({'message': 'Image processed successfully', 'image': img_str, 'text': text_content, 'label': web_entities, 'og_img': original_img_str})

if __name__ == '__main__':
    app.run(debug=True)