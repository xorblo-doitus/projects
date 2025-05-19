cleaned = []

with open("docs/assets/data/translations.csv", "r", encoding="utf-8") as file:
	first_line = file.readline().rstrip()
	to_crop = 0
	for char in first_line[::-1]:
		if char == ",":
			to_crop += 1
		else:
			break
	
	if to_crop > 0:
		for row in [first_line] + file.readlines():
			row = row.rstrip()
			if row.endswith(","):
				row = row[:-to_crop]
			cleaned.append(row)
	else:
		cleaned = [first_line] + file.readlines()

with open("docs/assets/data/translations.csv", "w", encoding="utf-8") as file:
	for i, row in enumerate(cleaned):
		if row.endswith("\n"):
			continue
		cleaned[i] += "\n"
	file.writelines(cleaned)