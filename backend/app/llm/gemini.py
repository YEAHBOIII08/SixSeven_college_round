"""Minimal server-side Gemini REST client with bounded retry and JSON mode."""
import json
import time
import threading
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any
import httpx
from app.core.config import settings

class LLMConfigurationError(RuntimeError): pass
class LLMProviderError(RuntimeError): pass
class LLMOutputError(RuntimeError): pass

# Keep provider requests on the model the user selected for its published free tier.
FREE_MODEL_ALLOWLIST={"gemini-3.5-flash-lite"}

class GeminiClient:
    _request_lock=threading.Lock()
    def __init__(self, api_key=None, model=None, timeout=None, transport=None):
        self.api_key=api_key if api_key is not None else settings.AGENTBREAK_LLM_API_KEY
        self.model=model or settings.AGENTBREAK_LLM_MODEL
        self.timeout=timeout or settings.AGENTBREAK_LLM_TIMEOUT_SECONDS
        self.transport=transport

    @staticmethod
    def is_configured():
        return bool(settings.AGENTBREAK_LLM_API_KEY and settings.AGENTBREAK_LLM_PROVIDER.lower()=="gemini" and settings.AGENTBREAK_LLM_MODEL in FREE_MODEL_ALLOWLIST)

    @staticmethod
    def _retry_delay(header, attempt, timeout):
        if not header: return min(3.0,0.5*(attempt+1),timeout)
        try: delay=float(header)
        except ValueError:
            try:
                retry_at=parsedate_to_datetime(header)
                if retry_at.tzinfo is None: retry_at=retry_at.replace(tzinfo=timezone.utc)
                delay=(retry_at-datetime.now(timezone.utc)).total_seconds()
            except (TypeError,ValueError,OverflowError): delay=0.5*(attempt+1)
        return min(3.0,max(0.25,delay),timeout)

    def generate_json(self, system_prompt: str, task: dict[str, Any], response_schema: dict[str, Any]) -> dict[str, Any]:
        if not self.api_key:
            raise LLMConfigurationError("Gemini API key is missing. Set AGENTBREAK_LLM_API_KEY in backend/.env.")
        if self.model not in FREE_MODEL_ALLOWLIST:
            raise LLMConfigurationError("Configured model is outside the approved free-model allowlist.")
        url=f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        body={"systemInstruction":{"parts":[{"text":system_prompt}]},
              "contents":[{"role":"user","parts":[{"text":json.dumps(task,ensure_ascii=False)}]}],
              "generationConfig":{"temperature":0.4,"maxOutputTokens":4096,"responseMimeType":"application/json","responseSchema":response_schema}}
        last_error="Provider request failed"
        for attempt in range(2):
            try:
                if not self._request_lock.acquire(timeout=self.timeout):
                    raise LLMProviderError("Timed out waiting for the serialized model request slot")
                try:
                    with httpx.Client(timeout=httpx.Timeout(self.timeout),transport=self.transport) as client:
                        response=client.post(url,headers={"x-goog-api-key":self.api_key,"Content-Type":"application/json"},json=body)
                finally:
                    self._request_lock.release()
                if response.status_code==429 or response.status_code>=500:
                    retry_header=response.headers.get("Retry-After")
                    delay=self._retry_delay(retry_header,attempt,self.timeout)
                    last_error=f"Provider temporary HTTP {response.status_code}"
                    if attempt==0: time.sleep(delay); continue
                    raise LLMProviderError(last_error)
                if response.is_error:
                    raise LLMProviderError(f"Gemini rejected the request (HTTP {response.status_code}). Check model access and API key configuration.")
                payload=response.json()
                try: output=payload["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError,IndexError,TypeError): raise LLMOutputError("Gemini returned no structured text output")
                try: parsed=json.loads(output)
                except (TypeError,json.JSONDecodeError) as exc: raise LLMOutputError("Gemini output was not valid JSON") from exc
                if not isinstance(parsed,dict): raise LLMOutputError("Gemini output must be a JSON object")
                usage=payload.get("usageMetadata",{})
                parsed["_usage"]={"prompt_tokens":usage.get("promptTokenCount"),"completion_tokens":usage.get("candidatesTokenCount"),"total_tokens":usage.get("totalTokenCount")}
                parsed["_provider"]={"provider":"gemini","model":self.model}
                return parsed
            except httpx.TimeoutException as exc:
                raise LLMProviderError("Gemini request timed out") from exc
            except httpx.RequestError as exc:
                raise LLMProviderError("Gemini service could not be reached") from exc
        raise LLMProviderError(last_error)
