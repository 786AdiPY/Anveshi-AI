from typing import Type
import os
from langchain_openai import ChatOpenAI
from .base import BaseProvider


class ChatOpenRouter(ChatOpenAI):
    def __init__(self, **kwargs):
        if "openai_api_base" not in kwargs and "base_url" not in kwargs:
            kwargs["openai_api_base"] = "https://openrouter.ai/api/v1"
        if "openai_api_key" not in kwargs and "api_key" not in kwargs:
            kwargs["openai_api_key"] = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        super().__init__(**kwargs)


class OpenRouterProvider(BaseProvider):
    """Provider for OpenRouter models."""

    def get_model_class(self) -> Type:
        """Returns the ChatOpenRouter class."""
        return ChatOpenRouter
