"""Fetch Kuaishou homepage HTML using Scrapling with TLS fingerprint impersonation."""
import sys
import os
import logging

# Suppress noisy Scrapling logs
logging.getLogger("scrapling").setLevel(logging.ERROR)

from scrapling import Fetcher


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.kuaishou.com/?isHome=1"

    # Fetcher with Chrome TLS fingerprint impersonation to bypass Kuaishou's bot detection
    d = Fetcher()
    resp = d.get(url)

    if resp.status != 200:
        print(f"ERROR: HTTP {resp.status}", file=sys.stderr)
        sys.exit(1)

    # Write raw UTF-8 bytes directly to stdout buffer to avoid GBK encoding
    # corruption on Windows (sys.stdout.encoding defaults to 'gbk' on CN Windows)
    sys.stdout.buffer.write(resp.html_content.encode("utf-8"))


if __name__ == "__main__":
    main()
