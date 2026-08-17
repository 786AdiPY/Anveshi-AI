import sys
import logging
import os
import warnings
import asyncio
import threading

# Suppress USER_AGENT warning
os.environ["USER_AGENT"] = "Pramaan AI/1.0"

# Filter noisy MCP/library output from stderr
class OutputFilter:
    def __init__(self, stream, blacklist):
        self.stream = stream
        self.blacklist = blacklist
    def write(self, data):
        if not any(term in data for term in self.blacklist):
            self.stream.write(data)
    def flush(self):
        self.stream.flush()
    def __getattr__(self, name):
        return getattr(self.stream, name)

sys.stderr = OutputFilter(sys.stderr, [
    "Secure MCP Filesystem Server",
    "Client does not support MCP Roots",
    "USER_AGENT environment variable not set",
    "FutureWarning"
])

from src.logger import setup_logger
from src.core.mcp_manager import get_mcp_manager

logger = setup_logger()
warnings.filterwarnings("ignore")

from src.system import MultiAgentSystem

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))


def run_mcp_loop(loop):
    """Run the background event loop for MCP connections."""
    asyncio.set_event_loop(loop)
    try:
        loop.run_forever()
    except Exception as e:
        logger.error(f"MCP background loop error: {e}")


def main():
    """Pramaan AI — Evidence-Grounded Research Agent entry point."""
    # Start background event loop for persistent MCP connections
    mcp_loop = asyncio.new_event_loop()
    mcp_thread = threading.Thread(target=run_mcp_loop, args=(mcp_loop,), daemon=True)
    mcp_thread.start()

    manager = get_mcp_manager()
    manager._main_loop = mcp_loop

    try:
        system = MultiAgentSystem()

        # Default research query — override via CLI or API
        default_query = (
            "What are the comparative advantages and limitations of "
            "Retrieval-Augmented Generation (RAG) vs Model Fine-Tuning "
            "for improving LLM accuracy in enterprise applications?"
        )

        # Support CLI argument
        if len(sys.argv) > 1:
            user_input = " ".join(sys.argv[1:])
        else:
            user_input = input(
                "\n🔬 Pramaan AI Research Agent\nEnter your research question "
                "(or press Enter for demo): "
            ).strip() or default_query

        print(f"\n▶ Starting research: {user_input}\n")
        system.run(user_input)

    finally:
        if mcp_loop.is_running():
            mcp_loop.call_soon_threadsafe(mcp_loop.stop)
        mcp_thread.join(timeout=2)


if __name__ == "__main__":
    main()

