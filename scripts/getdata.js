document.addEventListener('discreteData', function(event) {
    var canvas = document.getElementById('content');
    var context = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;
    if (width * height > 1000000) {
        alert('Image too large to process (more than 1 million pixels). Please crop the image first.');
        return;
    }

    var logarithmic = sharedData.logarithmic;

    var array2d = [];
    for (let i = 0; i < height; i++) { // Iterate over height first~
        var row = [];
        for (let j = 0; j < width; j++) { // Then iterate over width
            var color = getColorAtPosition(j, i); // Correct order of coordinates
            var hexval = rgbToHex(color.r, color.g, color.b);
            if (sharedData.colorMap.has(hexval)) {
                row.push(truncateToHundredths(sharedData.colorMap.get(hexval))); // Ensure truncation here
            } else {
                var tolerance = sharedData.tolerance;
                var closest = 0;
                var closestDist = Number.MAX_VALUE;
                for (let [key, value] of sharedData.colorMap) {
                    var col = hexToRgb(key);
                    var dist = Math.sqrt(Math.pow(color.r - col.r, 2) + Math.pow(color.g - col.g, 2) + Math.pow(color.b - col.b, 2));
                    if (dist < closestDist) {
                        closest = value;
                        closestDist = dist;
                    }
                }
                if (closestDist <= tolerance) {
                    row.push(truncateToHundredths(closest));
                } else {
                    row.push(-1);
                }
            }
        }
        array2d.push(row);
    }

    // Fill -1 with closest non -1 value using BFS
    if (!sharedData.mask) {fillClosestValues(array2d, width, height);}

    var csv = 'data:text/csv;charset=utf-8,';
    array2d.forEach(function(row) {
        csv += row.join(',');
        csv += '\n';
    });
    var encodedUri = encodeURI(csv);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'data.csv');
    document.body.appendChild(link);
    link.click();
});

function getColorAtPosition(x, y) {
    const canvas = document.getElementById('content');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(x, y, 1, 1);
    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];
    return { r, g, b };
}

function hexToRgb(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
}

function truncateToHundredths(num) {
    let factor = Math.pow(10, 2); // 10^2 = 100
    return Math.trunc(num * factor) / factor;
}

function fillClosestValues(array, width, height) {
    let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let queue = [];

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (array[i][j] !== -1) {
                queue.push([i, j]);
            }
        }
    }

    while (queue.length > 0) {
        let [x, y] = queue.shift();
        for (let [dx, dy] of directions) {
            let nx = x + dx;
            let ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < height && ny < width && array[nx][ny] === -1) {
                array[nx][ny] = array[x][y];
                queue.push([nx, ny]);
            }
        }
    }
}
