
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
    def get_file_info(self):
        if not file_path or not file_path.is_file():
            return None

        return {
            "name": file_path.name,
            "path": str(file_path),
            "url": "http://127.0.0.1:8765/video",
        }


if __name__ == "__main__":
    threading.Thread(target=run_server, daemon=True).start()
    api = Api()
    window = webview.create_window(
        file_name,
        "public/index.html",
        width=1000,
        height=600,
        js_api=api,
    )
    if window is None:
        raise RuntimeError("Failed to create the pywebview window")

    webview.start(debug=True)
