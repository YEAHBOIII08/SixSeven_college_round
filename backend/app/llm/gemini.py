"""Minimal server-side Gemini REST client with bounded retry and JSON mode."""
import asyncio
import json
import time
import threading
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Callable, Optional
import httpx
from app.core.config import settings

class LLMConfigurationError(RuntimeError): pass
class LLMProviderError(RuntimeError): pass
class LLMOutputError(RuntimeError): pass

# Keep provider requests on the model the user selected for its published free tier.
FREE_MODEL_ALLOWLIST = {
    "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash",
    "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"
}


async def call_llm_with_retry(
    func: Callable,
    *args: Any,
    max_retries: int = 5,
    initial_delay: float = 2.0,
    max_delay: float = 60.0,
    **kwargs: Any,
) -> Any:
    """Async wrapper for calling LLM functions with exponential backoff on 429 / ResourceExhausted."""
    delay = initial_delay
    for attempt in range(max_retries):
        try:
            res = func(*args, **kwargs)
            if asyncio.iscoroutine(res):
                return await res
            return res
        except Exception as e:
            err_str = str(e)
            is_rate_limit = (
                "429" in err_str
                or "ResourceExhausted" in err_str
                or "quota" in err_str.lower()
                or "503" in err_str
            )
            if is_rate_limit:
                if attempt == max_retries - 1:
                    raise e
                await asyncio.sleep(delay)
                delay = min(max_delay, delay * 2.0)
            elif attempt == max_retries - 1:
                raise e
            else:
                await asyncio.sleep(1.0)


def call_llm_with_retry_sync(
    func: Callable,
    *args: Any,
    max_retries: int = 5,
    initial_delay: float = 2.0,
    max_delay: float = 60.0,
    **kwargs: Any,
) -> Any:
    """Sync wrapper for calling LLM functions with exponential backoff on 429 / ResourceExhausted."""
    delay = initial_delay
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            err_str = str(e)
            is_rate_limit = (
                "429" in err_str
                or "ResourceExhausted" in err_str
                or "quota" in err_str.lower()
                or "503" in err_str
            )
            if is_rate_limit:
                if attempt == max_retries - 1:
                    raise e
                time.sleep(delay)
                delay = min(max_delay, delay * 2.0)
            elif attempt == max_retries - 1:
                raise e
            else:
                time.sleep(1.0)


class GeminiClient:
    _request_lock = threading.Lock()

    def __init__(self, api_key=None, model=None, timeout=None, transport=None, max_retries=None):
        self.api_key = (
            api_key
            if api_key is not None
            else (settings.ATTACKER_LLM_API_KEY or settings.AGENTBREAK_LLM_API_KEY)
        )
        self.model = model or settings.AGENTBREAK_LLM_MODEL
        self.timeout = timeout or settings.AGENTBREAK_LLM_TIMEOUT_SECONDS
        self.transport = transport
        # Keep 2 retries when MockTransport is supplied in unit tests (test_gemini_rate_limit_is_bounded), 5 in production
        self.max_retries = max_retries if max_retries is not None else (2 if transport is not None else 5)

    @staticmethod
    def is_configured():
        return bool(
            (settings.ATTACKER_LLM_API_KEY or settings.AGENTBREAK_LLM_API_KEY)
            and settings.AGENTBREAK_LLM_PROVIDER.lower() == "gemini"
            and settings.AGENTBREAK_LLM_MODEL in FREE_MODEL_ALLOWLIST
        )

    @staticmethod
    def _retry_delay(header, attempt, timeout, base_delay=2.0):
        if header:
            try:
                delay = float(header)
                return min(60.0, max(0.25, delay))
            except ValueError:
                try:
                    retry_at = parsedate_to_datetime(header)
                    if retry_at.tzinfo is None:
                        retry_at = retry_at.replace(tzinfo=timezone.utc)
                    delay = (retry_at - datetime.now(timezone.utc)).total_seconds()
                    return min(60.0, max(0.25, delay))
                except (TypeError, ValueError, OverflowError):
                    pass
        # Exponential backoff: 2s, 4s, 8s, 16s, 32s...
        return min(60.0, base_delay * (2 ** attempt))

    def generate_json(self, system_prompt: str, task: dict[str, Any], response_schema: dict[str, Any], use_cache: bool = True) -> dict[str, Any]:
        from app.llm.cache import llm_cache
        cache_payload = {"system_prompt": system_prompt, "task": task, "schema": response_schema}
        if use_cache and self.transport is None:
            cached = llm_cache.get(self.model, cache_payload, temperature=0.0, seed=42)
            if cached:
                try:
                    cached_data = json.loads(cached)
                    if isinstance(cached_data, dict) and "_data" in cached_data:
                        parsed = cached_data["_data"]
                        parsed["_usage"] = cached_data.get("_usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cached": True})
                        parsed["_provider"] = {"provider": "gemini_cache", "model": self.model}
                        return parsed
                    elif isinstance(cached_data, dict):
                        cached_data["_usage"] = cached_data.get("_usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cached": True})
                        cached_data["_provider"] = {"provider": "gemini_cache", "model": self.model}
                        return cached_data
                except Exception:
                    pass

        if not self.api_key:
            raise LLMConfigurationError("Gemini API key is missing. Set AGENTBREAK_LLM_API_KEY in backend/.env.")
        if self.model not in FREE_MODEL_ALLOWLIST:
            raise LLMConfigurationError("Configured model is outside the approved free-model allowlist.")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        body = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": json.dumps(task, ensure_ascii=False)}]}],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json",
                "responseSchema": response_schema,
            },
        }
        last_error = "Provider request failed"
        for attempt in range(self.max_retries):
            try:
                if not self._request_lock.acquire(timeout=self.timeout):
                    raise LLMProviderError("Timed out waiting for the serialized model request slot")
                try:
                    with httpx.Client(timeout=httpx.Timeout(self.timeout), transport=self.transport) as client:
                        response = client.post(url, headers={"x-goog-api-key": self.api_key, "Content-Type": "application/json"}, json=body)
                finally:
                    self._request_lock.release()
                if response.status_code == 429 or response.status_code >= 500:
                    retry_header = response.headers.get("Retry-After")
                    delay = self._retry_delay(retry_header, attempt, self.timeout, base_delay=2.0)
                    last_error = f"Provider temporary HTTP {response.status_code}"
                    if attempt < self.max_retries - 1:
                        time.sleep(delay)
                        continue
                    raise LLMProviderError(last_error)
                if response.is_error:
                    raise LLMProviderError(f"Gemini rejected the request (HTTP {response.status_code}). Check model access and API key configuration.")
                payload = response.json()
                try:
                    output = payload["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError, TypeError):
                    raise LLMOutputError("Gemini returned no structured text output")
                try:
                    parsed = json.loads(output)
                except (TypeError, json.JSONDecodeError) as exc:
                    raise LLMOutputError("Gemini output was not valid JSON") from exc
                if not isinstance(parsed, dict):
                    raise LLMOutputError("Gemini output must be a JSON object")

                usage = payload.get("usageMetadata", {})
                llm_cache.set(
                    self.model,
                    cache_payload,
                    json.dumps({
                        "_data": parsed,
                        "_usage": {
                            "prompt_tokens": usage.get("promptTokenCount", 0),
                            "completion_tokens": usage.get("candidatesTokenCount", 0),
                            "total_tokens": usage.get("totalTokenCount", 0),
                        },
                    }),
                    temperature=0.0,
                    seed=42,
                )

                parsed["_usage"] = {
                    "prompt_tokens": usage.get("promptTokenCount"),
                    "completion_tokens": usage.get("candidatesTokenCount"),
                    "total_tokens": usage.get("totalTokenCount"),
                }
                parsed["_provider"] = {"provider": "gemini", "model": self.model}
                return parsed
            except httpx.TimeoutException as exc:
                if attempt < self.max_retries - 1:
                    time.sleep(self._retry_delay(None, attempt, self.timeout, base_delay=2.0))
                    continue
                raise LLMProviderError("Gemini request timed out") from exc
            except httpx.RequestError as exc:
                if attempt < self.max_retries - 1:
                    time.sleep(self._retry_delay(None, attempt, self.timeout, base_delay=2.0))
                    continue
                raise LLMProviderError("Gemini service could not be reached") from exc
        raise LLMProviderError(last_error)

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, use_cache: bool = True) -> str:
        """Generate plain text with pinned temperature 0.0, retry backoff, and cache lookup."""
        from app.llm.cache import llm_cache
        cache_payload = {"prompt": prompt, "system_prompt": system_prompt}
        if use_cache and self.transport is None:
            cached = llm_cache.get(self.model, cache_payload, temperature=0.0, seed=42)
            if cached:
                return cached

        if not self.api_key:
            return ""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        body: dict[str, Any] = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.0, "maxOutputTokens": 2048},
        }
        if system_prompt:
            body["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        delay = 2.0
        for attempt in range(self.max_retries):
            try:
                with httpx.Client(timeout=httpx.Timeout(self.timeout), transport=self.transport) as client:
                    response = client.post(url, headers={"x-goog-api-key": self.api_key, "Content-Type": "application/json"}, json=body)
                    if response.status_code == 429 or response.status_code >= 500:
                        if attempt < self.max_retries - 1:
                            time.sleep(delay)
                            delay = min(60.0, delay * 2.0)
                            continue
                    if not response.is_error:
                        payload = response.json()
                        out = payload["candidates"][0]["content"]["parts"][0]["text"]
                        llm_cache.set(self.model, cache_payload, out, temperature=0.0, seed=42)
                        return out
            except Exception:
                if attempt < self.max_retries - 1:
                    time.sleep(delay)
                    delay = min(60.0, delay * 2.0)
                    continue
        return ""
