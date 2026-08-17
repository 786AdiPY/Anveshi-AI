from typing import Type
from .base import BaseProvider


class AnthropicProvider(BaseProvider):
    """Provider for Anthropic models."""

    def get_model_class(self) -> Type:
        """Returns the ChatAnthropic class."""
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic
        except ImportError:
            from langchain_community.chat_models import ChatAnthropic
            return ChatAnthropic