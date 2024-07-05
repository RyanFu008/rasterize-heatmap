window.sharedData = {};

document.getElementById('uploadButton').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        window.sharedData.uploadedFile = file;
        const fileUploadedEvent = new CustomEvent('fileUploaded', { detail: { file } });
        document.dispatchEvent(fileUploadedEvent);
        document.getElementById('pageInput').value = 1;

    }
});

document.getElementById('discreteButton').addEventListener('click', function(event) {
    const discreteEvent = new CustomEvent('discrete');
    document.dispatchEvent(discreteEvent);
});

document.getElementById('pageButton').addEventListener('click', function(event) {
    const page = parseInt(document.getElementById('pageInput').value);
    const pageChangedEvent = new CustomEvent('pageChanged', { detail: { page } });
    document.dispatchEvent(pageChangedEvent);
});

document.getElementById('cropButton').addEventListener('click', function(event) {
    sharedData.crop = true; crop = 1;
    const cropEvent = new CustomEvent('crop', { detail: { crop } });
    document.dispatchEvent(cropEvent);
});