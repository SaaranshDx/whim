let isFullscreen = false;
let handlingNativeFullscreen = false;
let imageGallery = [];
let imageBaseUrl = "";
let currentImageIndex = -1;

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
        imageGallery = file.images?.length
            ? file.images
            : [{ name: file.name }];
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
    imageBaseUrl = src;
    currentImageIndex = imageGallery.findIndex(
        imageFile => imageFile.name === fileName
    );
    if (currentImageIndex < 0) currentImageIndex = 0;

    const imageUrl = new URL(imageBaseUrl);
    imageUrl.searchParams.set("name", fileName);
    container.hidden = false;
    image.alt = fileName;
    image.src = imageUrl.toString();
    updateImageNavigation();
}

function updateImageNavigation() {
    document.getElementById("image-prev").disabled =
        currentImageIndex <= 0;
    document.getElementById("image-next").disabled =
        currentImageIndex < 0 || currentImageIndex >= imageGallery.length - 1;
}

function navigateImage(direction) {
    const nextIndex = currentImageIndex + direction;
    if (nextIndex < 0 || nextIndex >= imageGallery.length) return;
    openImage(imageBaseUrl, imageGallery[nextIndex].name);
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

document.getElementById("image-prev").addEventListener(
    "click",
    () => navigateImage(-1)
);
document.getElementById("image-next").addEventListener(
    "click",
    () => navigateImage(1)
);

document.addEventListener("keydown", event => {
    if (
        imageGallery.length > 1
        && (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
        event.preventDefault();
        navigateImage(event.key === "ArrowLeft" ? -1 : 1);
        return;
    }

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
