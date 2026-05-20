import json
from typing import Any, Dict, List

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_ollama import ChatOllama


class LLMClient:
    """
    你后面把这里替换成真实模型调用。
    要求:
    1. 输入 prompt / messages
    2. 返回 JSON dict
    """
    def __init__(
        self,
        model: str = "qwen2.5:7b",
        base_url: str = "http://localhost:11434",
        temperature: float = 0.1,
        num_ctx: int = 8192,
    ) -> None:
        self.model = ChatOllama(
            model=model,
            base_url=base_url,
            temperature=temperature,
            num_ctx=num_ctx,
        )

    def invoke(self, system_prompt: str, user_payload: Any) -> str:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(
                content=(
                    f"Input payload:\n{json.dumps(user_payload, ensure_ascii=False, indent=2) if isinstance(user_payload, (dict, list)) else str(user_payload)}"
                )
            ),
        ]

        response = self.model.invoke(messages)
        content = response.content
        if isinstance(content, list):
            return "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
        return str(content)

    def invoke_json(self, system_prompt: str, user_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        约定:
        - system_prompt 说明任务和 JSON schema 要求
        - user_payload 是要送进模型的数据
        - 返回 dict
        """
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(
                content=(
                    "Return valid JSON only.\n\n"
                    f"Input payload:\n{json.dumps(user_payload, ensure_ascii=False, indent=2)}"
                )
            ),
        ]

        response = self.model.invoke(messages)

        content = response.content
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
        elif not isinstance(content, str):
            content = str(content)

        content = content.strip()

        # 尝试直接解析 JSON
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        # 尝试提取 markdown code fence 里的 json
        if "```json" in content:
            try:
                json_block = content.split("```json", 1)[1].split("```", 1)[0].strip()
                return json.loads(json_block)
            except Exception:
                pass

        if "```" in content:
            try:
                json_block = content.split("```", 1)[1].split("```", 1)[0].strip()
                return json.loads(json_block)
            except Exception:
                pass

        raise ValueError(f"Model did not return valid JSON. Raw output:\n{content}")
