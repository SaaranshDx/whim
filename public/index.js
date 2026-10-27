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

    if (file) {
        console.log(file.name);
        console.log(file.path);
    }
}

async function getFileMeta() {
  try {
    const fileMeta = await window.pywebview.api.get_file_info();
    return [fileMeta.name, fileMeta.path];
  } catch (error) {
    return undefined;
  }
}



// this is for the future support for other files
const fileMeta = getFileMeta();
async function determineFileType(fileMeta) {
  try {
    const videoExtensions = [
        ".mp4", ".m4v", ".mkv", ".webm", ".mov",
        ".avi", ".wmv", ".flv", ".f4v", ".mpeg",
        ".mpg", ".m2v", ".m2ts", ".mts", ".ts",
        ".vob", ".ogv", ".3gp", ".3g2", ".asf",
        ".rm", ".rmvb", ".divx", ".y4m", ".mxf",
        ".ivf", ".bik", ".smk", ".amv", ".mjpeg",
        ".mjpg", ".wtv", ".dvr-ms"
    ];
    const fileName = fileMeta[0];
    const isVideo = videoExtensions.some(ext =>
        fileName.toLowerCase().endsWith(ext)
    );
    if (isVideo) {
      return `video`;
    }
  } catch (error) {
    return undefined;
  }
}

init();
