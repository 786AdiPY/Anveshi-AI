from typing import Type
from .base import BaseProvider


class ChatGroqProvider(BaseProvider):
    """Provider for ChatGroq models."""

    def get_model_class(self) -> Type:
        """Returns the ChatGroq class."""
        try:
            from langchain_groq import ChatGroq
            return ChatGroq
        except ImportError:
            from langchain_community.chat_models import ChatGroq
            return ChatGroq