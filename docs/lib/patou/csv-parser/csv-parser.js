class CSVParser {
	/**
	 * By default, use `,` and `\n` as delimiter.
	 * 
	 * @param {String} valueDelimiter 
	 * @param {String} lineDelimiter 
	 */
	constructor(valueDelimiter = ",", lineDelimiter = "\n", stringDelimiter = "\"") {
		this.valueDelimiter = valueDelimiter;
		this.lineDelimiter = lineDelimiter;
		this.stringDelimiter = stringDelimiter;
		this.data = [];
	}
	
	// /**
	//  * 
	//  * @param {String} line 
	//  * @returns {Array<String>}
	//  */
    // parseLine(line) {
	// 	let result = [];
	// 	const parts = line.split(this.valueDelimiter);
		
	// 	for (let i = 0; i < parts.length; i++) {
	// 		let part = parts[i];
	// 		if (part.startsWith(this.stringDelimiter)) {
	// 			while (((!part.endsWith(this.stringDelimiter)) || part.endsWith(this.escapedStringDelimiter)) && !part.endsWith('"""')) {
	// 				i++;
	// 				part += "," + parts[i];
	// 			};
	// 			part = part.slice(1, -1); // On enlève les guillemets
	// 		};
	// 		result.push(part.replace("\n", "<br>").replace('""', '"'));
	// 	}
		
	// 	return result;
	// }
    
	// /**
	//  * 
	//  * @param {Array<String>} lines 
	//  */
    // parseLines(lines) {
	// 	// lines = this.trimCSV(lines); // Inutile depuis `.split("\r\n")` au lieu de `.split("\n")`
		
	// 	// lines.reverse()
	// 	// const header = this.parseLine(lines.pop());

	// 	// let argumentMapper = new Map(); // bidouillage pour remplacer **kwargs

	// 	line_loop: for (const [lineIdx, line] of lines.entries()) {
	// 		let values = this.parseLine(line);
	// 		for (let [columnIdx, value] of values.entries()) {
	// 			value = value.trim();
	// 			if (value == "" || value == "\r") {
	// 				console.warn(`Incomplete easter egg info at line ${lineIdx + 2} of the csv configuration file.`); // +2 because header was removed
	// 				continue line_loop;
	// 			}
	// 			// argumentMapper.set(header[columnIdx], value);
	// 		}
	// 		// new EasterEgg(argumentMapper);
	// 	}
	// }
    
	/**
	 * Fill data with what is read in text.
	 * 
	 * @param {String} text 
	 * @returns {CSVParser} self
	 */
    parseText(text) {
		// Clear data
		this.data.length = 0;
		
		// On GitHub Pages, \r\n turn into \n, so we force
		// this behaviour to have consistent results.
		text = text.replaceAll("\r\n", "\n");
		
		let bufferText = "";
		let bufferLine = [];
		
		// Enables "" escaping
		let specialCharacterBehaviour = true;
		// When false, we are in between double-quotes
		let outOfString = true;
		
		let idx = -1;
		for (const character of text) {
			idx += 1;
			
			if (specialCharacterBehaviour) {
				if (character == this.stringDelimiter) {
					if (!outOfString && text[idx + 1] == this.stringDelimiter) {
						specialCharacterBehaviour = false;
					} else {
						outOfString = !outOfString;
					}
					continue;
				}
				
				if (outOfString) {
					switch (character) {
						case this.lineDelimiter:
							bufferLine.push(bufferText);
							bufferText = "";
							this.data.push(bufferLine);
							bufferLine = [];
							continue;
						case this.valueDelimiter:
							bufferLine.push(bufferText);
							bufferText = "";
							continue;
					}
				}
			}
			
			bufferText += character;
			specialCharacterBehaviour = true;
		}
		
		if (bufferText != "") {
			bufferLine.push(bufferText);
			this.data.push(bufferLine);
		}
		
		return this;
	}
	
	*[Symbol.iterator] () {
		let headers = this.data[0];
		
		for (let rowIdx = 1; rowIdx < this.data.length; rowIdx += 1) {
			let result = new Map();
			for (let columnIdx = 0; columnIdx < this.data[rowIdx].length; columnIdx += 1) {
				result.set(
					columnIdx <= headers.length ? headers[columnIdx] : "undefined-" + columnIdx,
					this.data[rowIdx][columnIdx]
				);
			}
			yield result;
		}
	}
	
	/**
	 * 
	 * @param {String} rowHeader 
	 * @param {String} columnHeader 
	 * @param {*} defaultValue 
	 */
	getCellByHeaders(rowHeader, columnHeader, defaultValue = undefined) {
		let columnIdx = this.data[0].findIndex(element => element == columnHeader);
		if (columnIdx == -1) {
			return defaultValue;
		}
		for (const row of this.data) {
			if (row[0] == rowHeader) {
				return row[columnIdx];
			}
		}
		
		return defaultValue;
	}
}



export { CSVParser }