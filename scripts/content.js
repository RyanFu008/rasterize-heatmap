// Ensure pdfjsLib is initialized
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

document.addEventListener('fileUploaded', function(event) {
    const file = event.detail.file;
    const reader = new FileReader();

    reader.onload = function(e) {
        const typedarray = new Uint8Array(e.target.result);
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            window.sharedData.pdfDoc = pdf; // Store the PDF document in sharedData
            renderPage(1); // Render the first page by default
        });
    };

    reader.readAsArrayBuffer(file);
});

document.addEventListener('pageChanged', function(event) {
    const pageNumber = event.detail.page;
    renderPage(pageNumber);
});

function renderPage(pageNumber) {
    const pdfDoc = window.sharedData.pdfDoc;
    if (pdfDoc) {
        pdfDoc.getPage(pageNumber).then(function(page) {
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.getElementById('content');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const canvas1 = document.getElementById('cursor-highlight');
            const canvas2 = document.getElementById('highlight-points');
            canvas1.height = viewport.height;
            canvas1.width = viewport.width;
            canvas2.height = viewport.height;
            canvas2.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            page.render(renderContext);
            setupMouseTracking(canvas);
        }).catch(function(error) {
            console.error('Error rendering page:', error);
        });
    }
}

function setupMouseTracking(canvas) {
    const nearCursorCanvas = document.getElementById('near-cursor');
    const nearCursorContext = nearCursorCanvas.getContext('2d');

    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate the top-left corner of the 20x20 pixel area centered around the cursor
        const startX = Math.max(0, x - 10);
        const startY = Math.max(0, y - 10);

        // Ensure the area is within the canvas boundaries
        const width = (x - 10 < 0 || x + 10 > canvas.width) ? Math.min(20, canvas.width - startX) : 20;
        const height = (y - 10 < 0 || y + 10 > canvas.height) ? Math.min(20, canvas.height - startY) : 20;

        // Get the image data for the 20x20 pixel area
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(startX, startY, width, height);

        // Clear the near-cursor canvas
        nearCursorContext.clearRect(0, 0, nearCursorCanvas.width, nearCursorCanvas.height);

        // Draw the zoomed-in image data on the near-cursor canvas
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const index = (i * width + j) * 4;
                const r = imageData.data[index];
                const g = imageData.data[index + 1];
                const b = imageData.data[index + 2];
                const a = imageData.data[index + 3] / 255;

                nearCursorContext.fillStyle = `rgba(${r},${g},${b},${a})`;
                nearCursorContext.fillRect(j * 10, i * 10, 10, 10); // Scale each pixel to 10x10
            }
        }

        // Draw the red crosshair in the center of the near-cursor canvas
        nearCursorContext.strokeStyle = 'red';
        nearCursorContext.lineWidth = 2;
        nearCursorContext.beginPath();
        nearCursorContext.moveTo(0, 100); // Horizontal line
        nearCursorContext.lineTo(200, 100);
        nearCursorContext.moveTo(100, 0); // Vertical line
        nearCursorContext.lineTo(100, 200);
        nearCursorContext.stroke();

        // Draw a fat dot at the center
        nearCursorContext.beginPath();
        nearCursorContext.arc(100, 100, 10, 0, 2 * Math.PI); // Draw a circle at the center
        nearCursorContext.fillStyle = 'red'; // Set the fill color to red
        nearCursorContext.fill(); // Fill the circle
        nearCursorContext.stroke(); // Stroke the circle
    });
}
