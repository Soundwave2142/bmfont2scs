/**

 @author Soundwave2142
 https://steamcommunity.com/id/Soundwave2142/

 Original idea by Etrusan

 02.28.2021

 **/

var kerningLimit = 1535; // kerning limit, change this value in case in-game value changes

document.getElementById("file-input").addEventListener('change', function () {
    document.getElementById("convert-btn").style = "";
});

document.getElementById('convert-btn').addEventListener('click', function () {

    var fr = new FileReader();
    fr.onload = function () {

        var generalInfo = {
            vert_span: find(fr.result, 'lineHeight='),
            line_spacing: 0,
            width: find(fr.result, 'scaleW='),
            height: find(fr.result, 'scaleH='),
            filename: find(fr.result, 'file="').split('.')[0]
        };

        var kerning = [], coordinates = [];

        fr.result.split(/\r?\n/).forEach(function (line) {
            var result;

            if (line.startsWith("char id=")) {
                result = handleData(line);

                if (result) {
                    coordinates.push(result);
                }
            } else if (line.startsWith("kerning first=")) {
                result = handleData(line, true);

                if (result) {
                    kerning.push(result);
                }
            }
        });

        kerning.sort(sortFunction);

        outputData(generalInfo, coordinates, kerning);
    };

    fr.readAsText(document.getElementById("file-input").files[0]);
});

/**
 * @param info
 * @param coords
 * @param kerning
 */
function outputData(info, coords, kerning) {
    var result = 'vert_span:' + info.vert_span + '\nline_spacing:' + info.line_spacing + '\n\nimage:' + info.filename + '.mat, ' + info.width + ', ' + info.height + '\n\n';

    result += '#NUM,    P_x, P_y,  W,  H,  L,  T,  A,  I     # character / glyph name\n\n';
    coords.forEach(function (setOfCoords) {

        setOfCoords.forEach(function (coord, key) {
            var itemLength = coord.length;
            var max = key > 2 ? 3 : 5;

            coord += setOfCoords.length > (key + 1) ? ',' : '';
            for (var i = 0; i < (max - itemLength); i++) {
                coord = ' ' + coord;
            }

            result += coord;
        });

        result += '     # \'' + unicode(setOfCoords[0]) + '\'\n';
    });

    if (kerning.length < kerningLimit || document.querySelector('input[name="kerningOption"]:checked').value === 'keep') {
        result += '\n# kerning...\n\n';

        var BreakException = {};

        try {
            kerning.forEach(function (setOfKerns, key) {
                if (key >= kerningLimit) {
                    throw BreakException
                }

                result += 'kern: ' + setOfKerns[0] + ', ' + setOfKerns[1] + ', ' + setOfKerns[2] + '      # \'' + unicode(setOfKerns[0]) + '\' -> \'' + unicode(setOfKerns[1]) + '\'\n';
            });
        } catch (e) {
            if (e !== BreakException) throw e;
        }
    }

    var zip = new JSZip();
    zip.file(info.filename + '.font', result);

    var mat = 'material : "ui.white_font" {\n	texture : "' + info.filename + '.tobj"\n	texture_name : "texture"\n}\n'
    zip.file(info.filename + '.mat', mat);

    var tobj = 'map 2d	' + info.filename + '.tga\naddr\n     clamp_to_edge\n     clamp_to_edge\ncolor_space linear\nnomips\nnocompress\n';
    zip.file(info.filename + '.tobj', tobj);

    zip.generateAsync({type: "blob"}).then(function (blob) {
        saveAs(blob, "bmfont2scs_" + info.filename + ".zip");
    });
}

/**
 * @param hex
 * @return string
 */
function unicode(hex) {
    return String.fromCodePoint(parseInt(hex.substring(1), 16));
}

/**
 * Currently unused
 * @param filename
 * @param text
 */
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

/**
 * @param item
 * @param kerning
 * @returns {*}
 */
function handleData(item, kerning = false) {
    var arrayCoords = [];

    item.replace(/[^0-9 \-+]+/g, "").split(" ").forEach(function (coords) {
        if (coords !== '') {
            arrayCoords.push(coords);
        }
    });

    if (arrayCoords.length > 0) {
        arrayCoords[0] = decToHex(arrayCoords[0]);

        if (!kerning) {
            arrayCoords.pop();
        } else {
            arrayCoords[1] = decToHex(arrayCoords[1]);
        }

        return arrayCoords;
    }

    return false;
}

/**
 * @param a
 * @param b
 * @returns {number}
 */
function sortFunction(a, b) {
    if (a[0] === b[0]) {
        return 0;
    } else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}

/**
 * @param val
 * @returns {string}
 */
function decToHex(val) {
    var element = parseInt(val, 10).toString(16);
    var prefix = 'x';

    for (var i = element.length; i < 4; i++) {
        prefix += '0';
    }

    return prefix + element;
}

/**
 * @param str
 * @param needle
 * @returns {*|string}
 */
function find(str, needle) {
    var index = str.indexOf(' ', str.indexOf(needle) + needle.length);
    index = str.indexOf('\n', str.indexOf(needle) + needle.length) < index ? str.indexOf('\n', str.indexOf(needle) + needle.length) : index;
    return str.substring(str.indexOf(needle) + needle.length, index);
}
