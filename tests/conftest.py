"""Make the project root importable when running tests via `pytest`.

Allows `from core.crawler import ...` to resolve without installing the
package.
"""
import os
import sys

# Insert the project root (one level up from tests/) onto sys.path.
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)
