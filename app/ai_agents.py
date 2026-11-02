import os
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv
from typing import Dict, List, Any

load_dotenv()

# --- Агент YandexGPT (временно отключён, т.к. возникают проблемы с правами) ---
# class YandexGPTAgent:
#     ...

# --- Агент DeepSeek (основной: диспетчер + кодинг) ---
class DeepSeekAgent:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")

    def generate(self, prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[{"role": "user", "content": prompt}],
                stream=False
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Ошибка DeepSeek: {e}"

# --- Агент Qwen (документация) ---
class QwenAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"

    def generate(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "qwen-turbo",
            "input": {"messages": [{"role": "user", "content": prompt}]}
        }
        try:
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=30)
            return response.json()["output"]["text"]
        except Exception as e:
            return f"Ошибка Qwen: {e}"

# --- Фабрика и диспетчер (DeepSeek) ---
class AgentFactory:
    def __init__(self):
        self.agents = {
            "deepseek": DeepSeekAgent(os.getenv("DEEPSEEK_API_KEY")),
            "qwen": QwenAgent(os.getenv("QWEN_API_KEY"))
        }
        # Диспетчер — DeepSeek (работает стабильно)
        self.dispatcher = self.agents["deepseek"]

    def _classify_task(self, task: str) -> List[str]:
        prompt = f"""
        Ты — диспетчер, который распределяет задачи между двумя AI-агентами:
        1. **coding** — пишет код (DeepSeek)
        2. **documentation** — пишет документацию (Qwen)

        Проанализируй задачу пользователя и определи, какие роли нужны.
        Ответь строго в формате JSON-массива, например: ["coding"] или ["coding", "documentation"].
        Задача пользователя: {task}
        """
        response = self.dispatcher.generate(prompt)
        try:
            clean = response.strip().replace("```json", "").replace("```", "").strip()
            roles = json.loads(clean)
            return roles if isinstance(roles, list) else ["coding"]
        except:
            return ["coding"]

    def process(self, task: str) -> Dict[str, Any]:
        roles = self._classify_task(task)
        results = {}
        role_to_agent = {
            "coding": "deepseek",
            "documentation": "qwen"
        }
        for role in roles:
            agent_name = role_to_agent.get(role, "deepseek")
            agent = self.agents[agent_name]
            role_prompt = f"Ты — специалист по {role}. Задача пользователя: {task}"
            results[role] = agent.generate(role_prompt)
        return results

    def process_combined(self, task: str) -> str:
        results = self.process(task)
        output = "✅ Результаты выполнения задачи:\n\n"
        for role, response in results.items():
            output += f"🔹 {role.upper()}:\n{response}\n\n"
        return output