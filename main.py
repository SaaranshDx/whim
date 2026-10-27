
import json
import os
import sys
import threading
from pathlib import Path
from urllib.parse import quote

import webview
from flask import Flask, abort, send_file, send_from_directory

file_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
file_name = file_path.name if file_path else "whim"

app = Flask(__name__)
public_dir = Path(__file__).resolve().parent / "public"
window_state_path = Path(
    os.environ.get("APPDATA", Path.home() / ".config")
) / "whim" / "window.json"
window_state_lock = threading.Lock()
app_window = None
DEFAULT_WINDOW_SIZE = (1000, 600)


def load_window_size():
    try:
        state = json.loads(window_state_path.read_text(encoding="utf-8"))
        width = int(state["width"])
        height = int(state["height"])
        if 200 <= width <= 10000 and 100 <= height <= 10000:
            return width, height
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        pass

    return DEFAULT_WINDOW_SIZE


def save_window_size(window, width, height):
    if not (200 <= width <= 10000 and 100 <= height <= 10000):
        return

    try:
        with window_state_lock:
            window_state_path.parent.mkdir(parents=True, exist_ok=True)
            temporary_path = window_state_path.with_suffix(".tmp")
            temporary_path.write_text(
                json.dumps({"width": width, "height": height}),
                encoding="utf-8",
            )
            temporary_path.replace(window_state_path)
    except OSError:
        pass


@app.get("/vendor/<path:filename>")
def serve_vendor_file(filename):
    return send_from_directory(public_dir / "vendor", filename)


@app.get("/file")
def serve_file():
    if not file_path or not file_path.is_file():
        abort(404)

    response = send_file(file_path, conditional=True)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


def run_server():
    app.run(
        host="127.0.0.1",
        port=8765,
        debug=False,
        use_reloader=False,
    )


class Api:
    def toggle_fullscreen(self):
        if app_window:
            app_window.toggle_fullscreen()

    def get_file_info(self):
        if not file_path or not file_path.is_file():
            return None

        return {
            "name": file_path.name,
            "path": str(file_path),
            "url": "http://127.0.0.1:8765/file",
        }


if __name__ == "__main__":
    threading.Thread(target=run_server, daemon=True).start()
    api = Api()
    if file_path and file_path.suffix.lower() == ".pdf":
        file_url = "http://127.0.0.1:8765/file"
        viewer_url = (
            "http://127.0.0.1:8765/vendor/pdfjs/web/viewer.html?file="
            + quote(file_url, safe="")
        )
    else:
        viewer_url = "public/index.html"

    window_width, window_height = load_window_size()
    window = webview.create_window(
        file_name,
        viewer_url,
        width=window_width,
        height=window_height,
        background_color="#111318",
        js_api=api,
    )
    if window is None:
        raise RuntimeError("Failed to create the pywebview window")

    app_window = window
    window.events.resized += save_window_size
    webview.start(debug=True)
