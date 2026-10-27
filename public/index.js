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

init();
