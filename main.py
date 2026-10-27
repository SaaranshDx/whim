import sys
import webview
from pathlib import Path

file_path = sys.argv[1] if len(sys.argv) > 1 else None
file_name = Path(file_path).name

class Api:
    def get_file_info(self):
        if not file_path:
            return None

        path = Path(file_path)
        return {
            "name": path.name,
            "path": str(path)
        }

print(file_path)
webview.create_window(file_name, 'public/index.html', js_api=Api())
webview.start(debug=True)
