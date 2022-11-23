const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log(process.argv);

if (process.argv.length < 3) {
    throw new Error('The script must be started with a path containing a questions.xlsx file');
}

const folder = process.argv[2];
const filePath = path.resolve(folder, 'questions.xlsx');

if (!fs.existsSync(filePath)) {
    throw new Error(`Could not find a questions.xlsx file in ${folder}`);
}

const wb = xlsx.readFile(filePath);

const sheetName = wb.SheetNames[0];

const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);

console.table(data);

const structure = {};

for (const entry of data) {
    const {
        Kategorie: category,
        Gruppe: group,
        Antwort: answer,
        Frage: question,
        Punkte: difficulty,
        Bild: image,
    } = entry;

    if (!structure[group]) {
        structure[group] = {};
    }

    if (!structure[group][category]) {
        structure[group][category] = [];
    }

    const obj = { answer, question, difficulty };

    if (image) {
        const rowFileName = path.resolve(folder, image);

        if (!fs.existsSync(rowFileName)) {
            throw new Error(`Could not find the file ${rowFileName} referenced in row ${entry}`);
        }

        const extension = path.extname(rowFileName);

        let contentType;

        if (extension === '.jpeg' || extension === '.jpg') {
            contentType = 'image/jpeg';
        }

        if (extension === '.gif') {
            contentType = 'image/gif';
        }

        if (extension === '.png') {
            contentType = 'image/png';
        }

        if (!contentType) {
            throw new Error(`Unknown extension ${extension} for row ${entry}`);
        }

        const b64 = fs.readFileSync(rowFileName).toString('base64');

        obj.image = `data:${contentType};base64,${b64}`;
    } else {
        obj.image = null;
    }

    structure[group][category].push(obj);
}

for (const group of Object.keys(structure)) {
    fs.writeFileSync(`group${group}.json`, JSON.stringify(structure[group], null, 4));
}