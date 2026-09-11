from app.ai_agents import AgentFactory

factory = AgentFactory()

task = "Напиши функцию на Python, которая вычисляет среднее арифметическое списка чисел."

result = factory.process_combined(task)
print(result)