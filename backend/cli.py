"""AgentBreak Command-Line Interface (Backend Runner)."""
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import main from root cli
root_cli = (backend_dir.parent / "cli.py").resolve()
if root_cli.exists():
    import importlib.util
    spec = importlib.util.spec_from_file_location("root_cli", str(root_cli))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    if __name__ == "__main__":
        mod.main()
