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
    if (!file) return;

    if (determineFileType(file.name) !== "video") return;

    const player = document.getElementById("vid-player");
    player.hidden = false;
    player.autoplay = true;
    player.src = file.url;
    player.load();
    player.play().catch(error => {
        console.warn("Video autoplay was blocked", error);
    });
}

function determineFileType(fileName) {
    const lowerFileName = fileName.toLowerCase();
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
        lowerFileName.endsWith(extension)
    ) ? "video" : undefined;
}

init();
