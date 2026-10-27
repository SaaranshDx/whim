import * as pdfjsLib from "./vendor/pdfjs/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "./vendor/pdfjs/pdf.worker.min.mjs",
    import.meta.url
).toString();

let pdfDocument = null;
let currentPdfPage = 1;
let pdfZoom = 1;
let pdfRenderId = 0;

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
    if (fileType === "video") {
        openVideo(file.url);
    } else if (fileType === "pdf") {
        await openPdf(file.url);
    }
}

function openVideo(src) {
    const player = document.getElementById("vid-player");
    const pdfViewer = document.getElementById("pdf-viewer");

    pdfViewer.hidden = true;
    player.hidden = false;
    player.src = src;
    player.load();
}

async function openPdf(src) {
    const player = document.getElementById("vid-player");
    const pdfViewer = document.getElementById("pdf-viewer");
    const status = document.getElementById("pdf-status");

    player.pause();
    player.removeAttribute("src");
    player.load();
    player.hidden = true;
    pdfViewer.hidden = false;
    status.textContent = "Loading PDF…";

    try {
        pdfDocument?.destroy();
        const loadingTask = pdfjsLib.getDocument({ url: src });
        pdfDocument = await loadingTask.promise;
        currentPdfPage = 1;
        pdfZoom = 1;

        document.getElementById("pdf-page-count").textContent = pdfDocument.numPages;
        status.textContent = "";
        updatePdfControls();
        await renderPdfPage();
    } catch (error) {
        console.error("Unable to open PDF", error);
        status.textContent = "Unable to open this PDF.";
        updatePdfControls();
    }
}

async function renderPdfPage() {
    if (!pdfDocument) return;

    const renderId = ++pdfRenderId;
    const page = await pdfDocument.getPage(currentPdfPage);
    const viewport = page.getViewport({ scale: pdfZoom });
    const outputScale = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.className = "pdf-page-canvas";
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    await page.render({
        canvasContext: context,
        viewport,
        transform: outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : undefined,
    }).promise;

    if (renderId !== pdfRenderId) return;

    document.getElementById("pdf-pages").replaceChildren(canvas);
    document.getElementById("pdf-page-number").textContent = currentPdfPage;
    document.getElementById("pdf-zoom-level").textContent = `${Math.round(pdfZoom * 100)}%`;
}

function updatePdfControls() {
    const hasPdf = Boolean(pdfDocument);
    document.getElementById("pdf-prev").disabled =
        !hasPdf || currentPdfPage <= 1;
    document.getElementById("pdf-next").disabled =
        !hasPdf || currentPdfPage >= pdfDocument?.numPages;
    document.getElementById("pdf-zoom-out").disabled =
        !hasPdf || pdfZoom <= 0.5;
    document.getElementById("pdf-zoom-in").disabled =
        !hasPdf || pdfZoom >= 3;
}

function determineFileType(fileName) {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.endsWith(".pdf")) return "pdf";

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

document.getElementById("pdf-prev").addEventListener("click", async () => {
    if (!pdfDocument || currentPdfPage <= 1) return;
    currentPdfPage -= 1;
    updatePdfControls();
    await renderPdfPage();
});

document.getElementById("pdf-next").addEventListener("click", async () => {
    if (!pdfDocument || currentPdfPage >= pdfDocument.numPages) return;
    currentPdfPage += 1;
    updatePdfControls();
    await renderPdfPage();
});

document.getElementById("pdf-zoom-out").addEventListener("click", async () => {
    if (!pdfDocument || pdfZoom <= 0.5) return;
    pdfZoom = Math.max(0.5, pdfZoom - 0.25);
    await renderPdfPage();
    updatePdfControls();
});

document.getElementById("pdf-zoom-in").addEventListener("click", async () => {
    if (!pdfDocument || pdfZoom >= 3) return;
    pdfZoom = Math.min(3, pdfZoom + 0.25);
    await renderPdfPage();
    updatePdfControls();
});

init();