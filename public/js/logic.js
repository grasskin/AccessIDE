var editor = ace.edit('editor');

editor.setTheme('ace/theme/twilight');
editor.session.setMode('ace/mode/python');
editor.getSession().setUseWrapMode(true);

let session = editor.getSession();
let aceDoc = session.getDocument();

let checkpointNames = [];

editor.insert(`x = 5
y = 2

# ~ checkpoint: "add5"
for i in range(5):
    y += 1

def calculateMeaning(n1, n2):
    n1 *= 8
    n2 %= 5
    meaning = n1 + n2
    return meaning

whatIsLife = str(calculateMeaning(x, y))
print "The meaning of life is " + whatIsLife
`);

function giveFeedback(text, exact) {
    textToSpeech(text);
    feedbackDisplay(text);

    let characters = ['(', ')', '{', '}', '[', ']', ';', ':'];
    let newWords = [" open parenthesis ", " close parenthesis ",
                    " open curly bracket ", " close curly bracket ",
                    " open square bracket ", " close square bracket ",
                    " semicolon ", " colon "];

    //removes characters to make text-to-speech better
    for(let i = 0; i < text.length; i++) {
        for(let j = 0; j < text.length; j++) {
            for(let k = 0; k < characters.length; k++) {

                let index = text.indexOf(characters[k]);

                if (index >= 0) {
                    let first = text.substring(0, index);
                    let replace = " "
                    if(exact)
                        replace = newWords[k];
                    let second = text.substring(index + 1, text.length);

                    text = first + replace + second;
                }
            }
        }
    }

    console.log(text);
    return text;
}

function checkError(error) {
    if (error.includes('on line')) {
        error = 'Error ' + error.substr(error.indexOf('on line'), error.length);
    }
    return error;
}

//adds checkpoints in a loaded file into the system
function loadCheckpoints() {
    let allLines = [];
    allLines = aceDoc.getAllLines().slice();
    let symbol = ' ~ ';

    for (let i = 0; i < allLines.length; i++) {
        if (allLines[i].includes('#' + symbol)) {
            lineSplit = allLines[i].split(' ');

            for (let i = 0; i < lineSplit.length; i++) {
                if (lineSplit[i].includes('~')) {
                    nameIndex = i + 2;

                    name = lineSplit[nameIndex];
                    name = name.substring(1, name.length - 1);

                    checkpointNames.splice(0, 0, name);
                }
            }
        }
    }
}

function runCommand(command) {
    if (command.includes('run')) {
        runit();
    } else if (command.includes('go to')) {
        commandGoTo(command);
    } else if (command.includes('read')) {
        commandRead(command);
    } else if (command.includes('new') || command.includes('make')) {
        commandMake(command);
    } else if (command.includes('save')) {
        commandSaveFile(command);
    }
}

//saves a file, given the name
function commandSaveFile(command) {
    if (command.includes('as')) {
        fileName = command.substring(command.indexOf('as') + 3, command.length);
        if (fileName.includes('.py')) {
            fileName = fileName.split('.py')[0];
        }
        downloadFile(fileName);
    } else {
        downloadFile('script');
    }
}

//figures out where to go, given the string command
function commandGoTo(command) {
    if (command.includes('line')) {
        let lineNum = getLineFromCommand(command);

        if (lineNum >= 0) {
            if (command.includes('end')) {
                goToLine(lineNum, 1);
            } else goToLine(lineNum, 0);
        }
    } else if (
        command.includes('next') ||
        command.includes('loop') ||
        command.includes('checkpoint')
    ) {
        goToObject(command);
    }
}

//goes to specific line
//loc 0 = start, loc 1 = end
function goToLine(lineNum, loc) {
    if (loc == 0) {
        editor.gotoLine(lineNum);
    }
    //goes to line below and then goes
    //to the left once (to go to end of prev line)
    else if (loc == 1) {
        let lastLine = editor.session.getLength();

        editor.gotoLine(lineNum + 1);
        editor.navigateLeft(1);
    }
}

function getLineFromCommand(command) {
    let index = 0;

    if (command.length > command.indexOf('line') + 4) {
        index = command.indexOf('line') + 5;
    }

    let lineNum = parseInt(command.substring(index, command.length));

    let lastLine = editor.session.getLength();

    if (lineNum > lastLine) {
        giveFeedback(
            'Line ' +
                lineNum.toString() +
                ' does not exist. Last line is ' +
                lastLine.toString()
        , false);
        return -1;
    }

    return lineNum;
}

function getLineLength(lineNum) {
    goToLine(lineNum + 1);
    editor.navigateLeft(1);

    return editor.getCursorPosition() + 1;
}

function goToObject(command) {
    if (command.includes('loop')) {
        //if user mentions a checkpoint, goes to it
        for (let name in checkpointNames) {
            if (command.includes(name)) {
                giveFeedback('Going to loop checkpoint ' + name, false);
                goToCheckpoint('loop', name);
            }
        }

        //otherwise, goes to next for loop
        if (command.includes('for')) {
            let line = editor.findNext('for ').startRow;
            let col = editor.findNext('for ').startColumn;

            //TODO
        } else if (command.includes('while')) {
            //TODO
        }
    } else if (command.includes('checkpoint')) {
        for (let name of checkpointNames) {
            if (command.includes(name)) {
                giveFeedback('Going to checkpoint ' + name, false);
                goToCheckpoint('checkpoint', name);
            }
        }
    }
}

function commandRead(command) {
    if (command.includes('this line') || command.includes('current line')) {
        let row = editor.getCursorPosition().row;
        let col = getLineLength(row + 1) - 1;
        let Range = ace.require('ace/range').Range;
        console.log(read(row, row));
        if(command.includes("exact"))
            giveFeedback(read(row, row), true);
        else
            giveFeedback(read(row, row), false);
    } else if (command.includes('line')) {
        let row = getLineFromCommand(command) - 1;
        goToLine(row + 1);
        let col = getLineLength(row + 1) - 1;
        let Range = ace.require('ace/range').Range;

        if(command.includes("exact"))
            giveFeedback(read(row, row), true);
        else
            giveFeedback(read(row, row), false);
            
    } else if (command.includes('this block')) {
        let start = editor.getCursorPosition().row;
        let in_block = false;
        let count = 0;
        let line = 0;

        while (
            !in_block ||
            (count > 0 && start + line < editor.session.getLength())
        ) {
            let curr_line = aceDoc.getLine(start + line);

            if (curr_line.includes('{')) {
                count++;
                in_block = true;
            } else if (curr_line.includes('}')) {
                count--;
            }
            line++;
        }
    }
}

function commandMake(command) {
    if (command.includes('checkpoint')) {
        let index = command.indexOf('checkpoint');
        if (command.length > index + 10) {
            let line = editor.getCursorPosition().row + 1;

            makeCheckpoint('checkpoint', command.substring(index + 11), line);
        }
    }
}

function read(from_row, to_row) {
    let lines = aceDoc.getLines(from_row, to_row);
    let result = '';
    result += lines[0];
    for (let i = 1; i < lines.length; i++) {
        lines[i] = lines[i].trim();
        result += lines[i] + '$';
    }
    if (result.charAt(result.length - 1) == '$') {
        result = result.substring(0, result.length - 1);
    }
    return result.replace('\t', '').trim();
}

function makeCheckpoint(type, name, line) {
    goToLine(line, 1);
    let cursorPosition = editor.getCursorPosition();
    let symbol = ' ~ ';
    let comment = '#' + symbol + type + ': "' + name + '"';

    session.insert(cursorPosition, comment);
    checkpointNames.splice(0, 0, name);
}

function goToCheckpoint(type, name) {
    let allLines = [];
    allLines = aceDoc.getAllLines().slice();
    let symbol = ' ~ ';
    let comment = '#' + symbol + type + ': "' + name + '"';

    for (let i = 0; i < allLines.length; i++) {
        if (allLines[i].includes(comment)) {
            goToLine(i + 2, 0);
            giveFeedback('Now at ' + type + ' ' + name, false);
            return;
        }
    }
    giveFeedback(
        "Checkpoint '" + name + "' of type '" + type + "' does not exist"
    , false);
}
