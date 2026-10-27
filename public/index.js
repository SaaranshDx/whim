let isFullscreen = false;
let handlingNativeFullscreen = false;

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

    const fileType = determineFileType(file.name);
    if (fileType === "image") {
        openImage(file.url, file.name);
        return;
    }
    if (fileType !== "video") return;

    const container = document.getElementById("video-container");
    const player = document.getElementById("vid-player");
    container.hidden = false;
    player.autoplay = true;
    const handleFullscreenChange = () => {
        const fullscreenElement =
            document.fullscreenElement || document.webkitFullscreenElement;
        if (fullscreenElement === player) {
            handleNativeFullscreenRequest();
        }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    player.addEventListener("fullscreenerror", handleNativeFullscreenRequest);
    player.addEventListener("webkitfullscreenerror", handleNativeFullscreenRequest);
    player.src = file.url;
    player.load();
    player.play().catch(error => {
        console.warn("Video autoplay was blocked", error);
    });
}

function openImage(src, fileName) {
    const container = document.getElementById("image-container");
    const image = document.getElementById("image-viewer");
    container.hidden = false;
    image.alt = fileName;
    image.src = src;
}

async function toggleFullscreen() {
    if (!window.pywebview?.api) return;

    try {
        await window.pywebview.api.toggle_fullscreen();
        isFullscreen = !isFullscreen;
    } catch (error) {
        console.error("Unable to toggle fullscreen", error);
    }
}

async function handleNativeFullscreenRequest() {
    if (handlingNativeFullscreen) return;

    handlingNativeFullscreen = true;
    try {
        const fullscreenElement =
            document.fullscreenElement || document.webkitFullscreenElement;
        const exitFullscreen =
            document.exitFullscreen || document.webkitExitFullscreen;
        if (fullscreenElement && exitFullscreen) {
            await exitFullscreen.call(document).catch(() => {});
        }
        await toggleFullscreen();
    } finally {
        handlingNativeFullscreen = false;
    }
}

document.addEventListener("keydown", event => {
    if (event.key === "F11" || (event.key === "Escape" && isFullscreen)) {
        event.preventDefault();
        toggleFullscreen();
    }
});

function determineFileType(fileName) {
    const lowerFileName = fileName.toLowerCase();
    const imageExtensions = [
        ".jpg", ".jpeg", ".jpe", ".jfif", ".pjpeg", ".pjp",
        ".png", ".gif", ".webp", ".avif", ".bmp", ".dib",
        ".svg", ".svgz", ".ico", ".cur"
    ];
    if (imageExtensions.some(extension =>
        lowerFileName.endsWith(extension)
    )) return "image";

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
