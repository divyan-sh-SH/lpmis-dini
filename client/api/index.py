"""
Vercel serverless entrypoint.
Vercel's Python runtime expects a class named `handler` that subclasses
BaseHTTPRequestHandler. This bridges the request to our FastAPI app via Mangum.
"""
import asyncio
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from main import app

try:
    from mangum import Mangum
except ImportError:
    Mangum = None

if Mangum:
    _mangum = Mangum(app, lifespan="off")
else:
    _mangum = None


def _build_event(handler_self: BaseHTTPRequestHandler) -> dict:
    parsed = urlparse(handler_self.path)
    path = parsed.path or "/"
    query = parse_qs(parsed.query) if parsed.query else {}
    query_string_params = {k: v[0] if len(v) == 1 else v for k, v in query.items()}

    content_length = int(handler_self.headers.get("Content-Length", 0))
    body = None
    if content_length:
        raw = handler_self.rfile.read(content_length)
        try:
            body = raw.decode("utf-8")
        except Exception:
            body = raw.hex()

    headers = {k.lower(): v for k, v in handler_self.headers.items()}

    return {
        "httpMethod": handler_self.command,
        "path": path,
        "headers": headers,
        "body": body,
        "queryStringParameters": query_string_params or None,
        "requestContext": {},
        "isBase64Encoded": False,
    }


class handler(BaseHTTPRequestHandler):
    """Vercel expects this class name. Routes the request to FastAPI via Mangum."""

    def do_GET(self):
        self._dispatch()

    def do_POST(self):
        self._dispatch()

    def do_DELETE(self):
        self._dispatch()

    def do_PUT(self):
        self._dispatch()

    def do_OPTIONS(self):
        self._dispatch()

    def _dispatch(self):
        if not _mangum:
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"detail":"Mangum not installed"}')
            return

        event = _build_event(self)
        try:
            response = asyncio.run(_mangum(event, {}))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode("utf-8"))
            return

        status = response.get("statusCode", 500)
        self.send_response(status)

        resp_headers = response.get("headers") or response.get("multiValueHeaders")
        if resp_headers and isinstance(resp_headers, dict):
            for k, v in resp_headers.items():
                val = v[0] if isinstance(v, list) else v
                self.send_header(k, val)
        self.end_headers()

        body = response.get("body") or ""
        if isinstance(body, dict):
            body = json.dumps(body)
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass
