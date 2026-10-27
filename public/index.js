async function init() {
    await new Promise(resolve => {
        if (window.pywebview?.api) {
            resolve();
        } else {
            window.addEventListener(
                "pywebviewready",
                resolve,
                { once: true }
            );
        }
    });

    const file = await window.pywebview.api.get_file_info();
    if (!file || determineFileType(file.name) !== "video") {
        return;
    }

    console.log(file.name);
    console.log(file.path);
    openVideo(file.url);
}

function openVideo() {
    const player = document.getElementById("vid-player");

    player.src = "http://127.0.0.1:8765/video";
    player.style.display = "block";
    player.load();
}

function determineFileType(fileName) {
    const videoExtensions = [
        ".mp4", ".m4v", ".mkv", ".webm", ".mov",
        ".avi", ".wmv", ".flv", ".f4v", ".mpeg",
        ".mpg", ".m2v", ".m2ts", ".mts", ".ts",
        ".vob", ".ogv", ".3gp", ".3g2", ".asf",
        ".rm", ".rmvb", ".divx", ".y4m", ".mxf",
        ".ivf", ".bik", ".smk", ".amv", ".mjpeg",
        ".mjpg", ".wtv", ".dvr-ms"
    ];

    return videoExtensions.some(extension =>
        fileName.toLowerCase().endsWith(extension)
    ) ? "video" : undefined;
}

init();
