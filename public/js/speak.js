// Requires request for HTTP requests
const request = require('request');
console.log(request);
// Requires fs to write synthesized speech to a file
const fs = require('fs');
// Requires readline-sync to read command line inputs
const readline = require('readline-sync');
// Requires xmlbuilder to build the SSML body
const xmlbuilder = require('xmlbuilder');

/*
 * These lines will attempt to read your subscription key from an environment
 * variable. If you prefer to hardcode the subscription key for ease of use,
 * replace process.env.SUBSCRIPTION_KEY with your subscription key as a string.
 */
// Prompts the user to input text.
let text = 'What would you like to convert to speech? ';

function textToSpeech(saveAudio) {
    let options = {};
    // This function retrieve the access token and is passed as callback
    // to request below.

    $.ajax({
        url: 'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issueToken',
        headers: {
            'Ocp-Apim-Subscription-Key': '0892540b79ca4a2e83165de34e4b3130',
            'Content-type': 'application/x-www-form-urlencoded'
        },
        data: '',
        method: 'POST',
        success: function(data) {
            saveAudio(data);
        }
    });
}

// Make sure to update User-Agent with the name of your resource.
// You can also change the voice and output formats. See:
// https://docs.microsoft.com/azure/cognitive-services/speech-service/language-support#text-to-speech
function saveAudio(accessToken) {
    // Create the SSML request.
    var doc = document.implementation.createDocument('', '', null);
    var speakElem = doc.createElement('speak');
    speakElem.setAttribute('version', '1.0');
    speakElem.setAttribute('xml:lang', 'en-us');
    var x = speakElem.appendChild(doc.createElement('voice'));
    x.setAttribute(
        'name',
        'Microsoft Server Speech Text to Speech Voice (en-US, Guy24KRUS)'
    );
    x.textContent = 'hello';
    body = new XMLSerializer().serializeToString(speakElem);
    console.log(body);

    $.ajax({
        url: 'https://eastus.tts.speech.microsoft.com/',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'cache-control': 'no-cache',
            'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
            'Content-Type': 'application/ssml+xml',
            'Access-Control-Allow-Origin': '*'
        },
        data: body,
        method: 'POST',
        success: function(data) {
            console.log(data);
        }
    });
    // This function makes the request to convert speech to text.
    // The speech is returned as the response.
    function convertText(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('Converting text-to-speech. Please hold...\n');
        } else {
            throw new Error(error);
        }
        console.log('Your file is ready.\n');
    }
    // Pipe the response to file.
}
