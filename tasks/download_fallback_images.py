import json
import requests

text_input = input("Entrez un dictionnaire avec l'id du projet en clé et l'URL de l'image en valeur :\n")
while not "}" in text_input:
	text_input += input()

imageURLs = json.loads(text_input)

for project_id, imageURL in imageURLs.items():
	img_data = requests.get(imageURL).content
	with open(f'docs/assets/images/thumbnails/fallbacks/{project_id}.png', 'wb') as file:
		file.write(img_data)