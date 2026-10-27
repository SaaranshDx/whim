
import sys
import threading
from pathlib import Path

import webview
from flask import Flask, abort, send_file

file_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
file_name = file_path.name if file_path else "whim"

app = Flask(__name__)


@app.get("/video")
def serve_video():
    if not file_path or not file_path.is_file():
        abort(404)

    return send_file(file_path, conditional=True)


def run_server():
    app.run(
        host="127.0.0.1",
        port=8765,
        debug=False,
        use_reloader=False,
    )


class Api:
    def __init__(self):
        self.window: webview.Window | None = None

    def get_file_info(self):
        if not file_path or not file_path.is_file():
            return None

        return {
            "name": file_path.name,
            "path": str(file_path),
            "url": "http://127.0.0.1:8765/video",
        }

    def resize_for_video(self, width, height):
        if self.window is None:
            return

        screen = webview.screens[0]

        max_width = int(screen.width * 0.9)
        max_height = int(screen.height * 0.85)

        scale = min(
            max_width / width,
            max_height / height,
            1.0
        )

        window = self.window
        window.resize(
            int(width * scale),
            int(height * scale)
        )

        window.show()

if __name__ == "__main__":
    threading.Thread(target=run_server, daemon=True).start()
    api = Api()
    window = webview.create_window(
        file_name,
        "public/index.html",
        js_api=api,
    )
    if window is None:
        raise RuntimeError("Failed to create the pywebview window")

    api.window = window
    webview.start(debug=True)
