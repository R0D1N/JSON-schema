const json_schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "attendees": {
            "type": "object",
            "$id": "#attendees",
            "properties": {
                "userId": {
                    "type": "integer"
                },
                "access": {
                    "enum": [
                        "view",
                        "modify",
                        "sign",
                        "execute"
                    ]
                },
                "formAccess": {
                    "enum": [
                        "view",
                        "execute",
                        "execute_view"
                    ]
                }
            },
            "required": [
                "userId",
                "access"
            ]
        }
    },
    "type": "object",
    "properties": {
        "id": {
            "anyOf": [
                {
                    "type": "string"
                },
                {
                    "type": "integer"
                }
            ]
        },
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "startDate": {
            "type": "integer"
        },
        "endDate": {
            "type": "integer"
        },
        "attendees": {
            "type": "array",
            "items": {
                "$ref": "#attendees"
            },
            "default": []
        },
        "parentId": {
            "anyOf": [
                {
                    "type": "null"
                },
                {
                    "type": "string"
                },
                {
                    "type": "integer"
                }
            ]
        },
        "locationId": {
            "anyOf": [
                {
                    "type": "null"
                },
                {
                    "type": "integer"
                }
            ]
        },
        "process": {
            "anyOf": [
                {
                    "type": "null"
                },
                {
                    "type": "string",
                    "format": "regex",
                    "pattern": "https:\\/\\/[a-z]+\\.corezoid\\.com\\/api\\/1\\/json\\/public\\/[0-9]+\\/[0-9a-zA-Z]+"
                }
            ]
        },
        "readOnly": {
            "type": "boolean"
        },
        "priorProbability": {
            "anyOf": [
                {
                    "type": "null"
                },
                {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100
                }
            ]
        },
        "channelId": {
            "anyOf": [
                {
                    "type": "null"
                },
                {
                    "type": "integer"
                }
            ]
        },
        "externalId": {
            "anyOf": [
                {
                    "type": "null"
                },
                {
                    "type": "string"
                }
            ]
        },
        "tags": {
            "type": "array"
        },
        "form": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "integer"
                },
                "viewModel": {
                    "type": "object"
                }
            },
            "required": [
                "id"
            ]
        },
        "formValue": {
            "type": "object"
        }
    },
    "required": [
        "id",
        "title",
        "description",
        "startDate",
        "endDate",
        "attendees"
    ]
}
let mainRecursive = (data) => {
    let obj = data.properties
    let res = data.type === "array"? [{}]: {};

    let random

    for( const field in obj ){
        if (data.required.some(a => a === field))
            random = 3
        else{
            random = generateRandomInteger(1, 2)
        }
        let value = null;
        switch (random){
            case 1:
                break
            case 2:
            case 3:
                if("enum" in obj[field]){
                    value = obj[field].enum[generateRandomInteger(0, (obj[field].enum.length - 1))]
                    valueAdd(data.type, value, res, field)
                }else if("anyOf" in obj[field]){

                    let body = obj[field].anyOf[generateRandomInteger(0, ( obj[field].anyOf.length - 1 ))]
                    value = whatValue(body, data)
                    valueAdd(data.type, value, res, field)
                }else{
                    value = whatValue(obj[field], data)
                    valueAdd(data.type, value, res, field)
                }
        }
    }
    return res
}

// Checks type in JSON-schema properties
function whatValue(body, data) {
    let value = null;
    switch (body.type){
        case 'boolean':
            value = generateRandomBoolean()
            break
        case 'string':
            if ("$ref" in body) {
                let field = body.$ref.slice(1);
                value = mainRecursive(data.definitions[field])
            }else{
                if(body.format === "regex") {
                    value = randomStringPattern(body.pattern)
                }else if(body.maxLength !== "" && body.minLength !== ""){

                    value = randomString(body.maxLength, body.minLength)
                }
                else if(body.maxLength !== ""){
                    value = randomString(body.maxLength)
                }
                else if(body.minLength !== ""){
                    value = randomString(body.minLength)
                }
                else{
                    value = randomString(10)
                }
            }

            break
        case 'number':
            if ("$ref" in body) {
                let field = body.$ref.slice(1);
                value = mainRecursive(data.definitions[field])
            }else{
                value = integerChecker(body, "number")
            }
            break
        case 'integer':
            if ("$ref" in body) {
                let field = body.$ref.slice(1);
                value = mainRecursive(data.definitions[field])
            }else{
                value = integerChecker(body, "integer")
            }
            break
        case 'array':
            let res = []
            value = []
            let min = body.minItems || 3;
            let max = body.maxItems || 5;
            for (let i = 0; i < generateRandomInteger(min, max); i++){
                if ("$ref" in body) {
                    let field = body.$ref.slice(1);
                    value.push(mainRecursive(data.definitions[field]))
                }else{
                    if("items" in body){
                        if ("$ref" in body.items) {
                            let field = body.items.$ref.slice(1);
                            value = mainRecursive(data.definitions[field])
                            value = valueAdd("array", value, res, field)
                        }else{
                            value = mainRecursive(body.items)
                            value = valueAdd(data.type, value, res)
                        }
                    }
                }
            }
            break
        case 'object':
            if ("$ref" in body) {
                let field = body.$ref.slice(1);
                value = mainRecursive(data.definitions[field])
            }else{
                if (body.properties){
                    value = mainRecursive(Object.assign({}, body))
                }else{
                    value = {}
                }
            }

            break
    }
    return value
}

// Generates a random integer can be restricted to a multiple of a given number
function generateRandomIntegerMultipleOf(multipleOf) {
    const randomNum = Math.floor(Math.random() * 1000) + 1
    const remainder = randomNum % multipleOf;
    return  randomNum - remainder;
}

// Generates a random boolean value
function generateRandomBoolean() {
    return Math.random() >= 0.5;
}

// Generates a random integer between min and max
function generateRandomInteger(min = -99, max = 99) {
    const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    return Math.floor(randomInt)
}

// Generates a random number between min and max
function randomNumber(min = -99, max = 99) {
    return Math.random() * (max - min + 1) + min;
}

// Generates a random string with a given length
function randomString(maxLength= 10, minLength = 5) {
    let string = ''
    maxLength = generateRandomInteger(minLength, maxLength)
    for (let i = 0; i < maxLength; i++) {
        string = string + String.fromCharCode(generateRandomInteger(32, 126))
    }
    return string
}

// Generates a random string that matches a given regex pattern
function randomStringPattern(pattern) {
    function generateRandomClassChar(classChars) {
        const charRegex = /[^\]]/g;
        const charArray = classChars.match(charRegex);
        let possibleChars = '';

        for (let i = 0; i < charArray.length; i++) {
            if (charArray[i] === '-' && i > 0 && i < charArray.length - 1) {
                // Character is a range, so add all characters in the range to the possible characters
                const startChar = charArray[i - 1].charCodeAt(0);
                const endChar = charArray[i + 1].charCodeAt(0);

                if (startChar >= 97 && endChar <= 122) {
                    // Range is [a-z], so add all characters in the English alphabet to the possible characters
                    possibleChars += 'abcdefghijklmnopqrstuvwxyz';
                } else if (startChar >= 65 && endChar <= 90) {
                    // Range is [A-Z], so add all uppercase characters in the English alphabet to the possible characters
                    possibleChars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                } else {
                    // Range is not [a-z] or [A-Z], so add characters in the range to the possible characters
                    for (let j = startChar; j <= endChar; j++) {
                        possibleChars += String.fromCharCode(j);
                    }
                }

                i += 2; // Skip over the end character of the range
            } else {
                // Character is not a range, so add it to the possible characters
                possibleChars += charArray[i];
            }
        }

        return possibleChars[Math.floor(Math.random() * possibleChars.length)];
    }

    let result = '';
    let inClass = false;
    let classChars = '';
    let prevChar = '';

    for (let i = 0; i < pattern.length; i++) {
        const char = pattern.charAt(i);

        if (char === '\\') {
            i++;
            const escapedChar = pattern.charAt(i);
            result += escapedChar;
            prevChar = escapedChar;
        } else if (inClass) {
            if (char === ']') {
                inClass = false;
                const classChar = generateRandomClassChar(classChars, prevChar);
                result += classChar;
                if (classChars.includes('-') && prevChar) {
                    prevChar = classChar;
                }
                classChars = '';
            } else if (char === '-') {
                prevChar = classChars.slice(-1);
            } else {
                classChars += char;
            }
        } else if (char === '+') {
            if (prevChar) {
                let repeatCount = Math.floor(Math.random() * 4) + 1;
                for (let j = 0; j < repeatCount; j++) {
                    result += prevChar;
                }
            }
        } else if (char === '[') {
            inClass = true;
        } else if (char === 'x') {
            const hexChar = Math.floor(Math.random() * 16).toString(16);
            result += hexChar;
            prevChar = hexChar;
        } else {
            result += char;
            prevChar = char;
        }
    }

    return result;
}

// Adds a value to an array or object
function valueAdd(type, value, res, field){
    if(type === "array"){
        res.push(value)
    }else{
        res[field] = value
    }
    return res
}

// Checks integer/number type and generate a random value
function integerChecker(body, type){
    let value
    if(body.minimum && body.maximum){
        value = generateRandomInteger(body.minimum, body.maximum)
    } else if (body.exclusiveMaximum && body.exclusiveMinimum){
        value = generateRandomInteger(body.exclusiveMinimum + 1, body.exclusiveMaximum - 1)
    }
    else if (body.maximum && body.exclusiveMinimum){
        value = generateRandomInteger(body.exclusiveMinimum + 1, body.maximum)
    }
    else if (body.exclusiveMaximum && body.minimum){
        value = generateRandomInteger(body.minimum, body.exclusiveMaximum - 1)
    }
    else if (body.exclusiveMaximum){
        value = generateRandomInteger(-99, body.exclusiveMaximum - 1)
    }
    else if (body.exclusiveMinimum){
        value = generateRandomInteger(body.exclusiveMinimum + 1, 99)
    }
    else if (body.minimum){
        value = generateRandomInteger(body.minimum, 99)
    }
    else if (body.maximum){
        value = generateRandomInteger(-99, body.maximum)
    }
    else if (body.multipleOf){
        value = generateRandomIntegerMultipleOf(body.multipleOf)
    }
    else{
        if (type === "integer"){
            value = generateRandomInteger()
        }else{
            value = +randomNumber().toFixed(2)
        }
    }

    return value
}

// Shows in console output object
for(let i = 0; i < 1; i++){
    console.log(mainRecursive(json_schema))
}
