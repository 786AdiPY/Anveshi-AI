from typing import Type
from .base import BaseProvider


class OllamaProvider(BaseProvider):
    """Provider for Ollama models."""

    def get_model_class(self) -> Type:
        """Returns the ChatOllama class."""
        try:
            from langchain_ollama import ChatOllama
            return ChatOllama
        except ImportError:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama