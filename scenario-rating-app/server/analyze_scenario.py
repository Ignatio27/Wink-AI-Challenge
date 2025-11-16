#!/usr/bin/env python3
import sys
import os

# Простая версия классификатора для демонстрации
# В реальной версии здесь будет полный код из llm_classifier.py

def parse_json_simple(data):
    """Простой парсер JSON без использования json модуля"""
    import re
    # Извлекаем значение content из JSON
    match = re.search(r'"content"\s*:\s*"([^"]*)"', data)
    if match:
        return match.group(1)
    return ""

def dict_to_json(d):
    """Простой конвертер dict в JSON без использования json модуля"""
    def escape_string(s):
        s = s.replace('\\', '\\\\')
        s = s.replace('"', '\\"')
        s = s.replace('\n', '\\n')
        s = s.replace('\r', '\\r')
        s = s.replace('\t', '\\t')
        return s
    
    def convert_value(v):
        if isinstance(v, str):
            return '"' + escape_string(v) + '"'
        elif isinstance(v, bool):
            return 'true' if v else 'false'
        elif isinstance(v, (int, float)):
            return str(v)
        elif isinstance(v, list):
            return '[' + ', '.join(convert_value(item) for item in v) + ']'
        elif isinstance(v, dict):
            items = []
            for k, val in v.items():
                items.append('"' + k + '": ' + convert_value(val))
            return '{' + ', '.join(items) + '}'
        elif v is None:
            return 'null'
        return str(v)
    
    return convert_value(d)

def analyze_scenario(content: str) -> dict:
    """
    Анализирует сценарий и возвращает возрастной рейтинг
    """
    # Простая эвристика для демонстрации
    content_lower = content.lower()
    
    rating = "OK"
    categories = []
    comment = "Содержимое безопасно для всех возрастов"
    
    # Проверка на мат
    profanity_words = ["блядь", "блять", "сука", "хуй", "пизда", "ебать", "ебал", "нахуй"]
    if any(word in content_lower for word in profanity_words):
        rating = "18+"
        categories.append("profanity")
        comment = "Обнаружена ненормативная лексика"
    
    # Проверка на насилие
    violence_words = ["убийство", "убить", "кровь", "труп", "избиение", "пытки"]
    if any(word in content_lower for word in violence_words):
        if rating != "18+":
            rating = "18+"
            categories = []
        categories.append("violence")
        comment = "Обнаружены сцены насилия"
    
    # Проверка на опасность
    danger_words = ["погоня", "преследование", "оружие", "угроза"]
    if any(word in content_lower for word in danger_words) and rating == "OK":
        rating = "16+"
        categories.append("danger")
        comment = "Присутствуют опасные ситуации"
    
    # Проверка на лёгкий конфликт
    conflict_words = ["спор", "ссора", "конфликт", "обида"]
    if any(word in content_lower for word in conflict_words) and rating == "OK":
        rating = "12+"
        categories.append("mild_conflict")
        comment = "Присутствуют лёгкие конфликтные ситуации"
    
    return {
        "rating": rating,
        "categories": categories,
        "comment": comment,
        "scenes": [
            {
                "scene_id": 1,
                "content": content[:200] + "..." if len(content) > 200 else content,
                "rating": rating,
                "categories": categories,
                "issues": [
                    {
                        "line": 1,
                        "text": content.split("\n")[0] if content.split("\n") else content[:100],
                        "category": categories[0] if categories else "none",
                        "severity": "high" if rating == "18+" else "medium" if rating in ["16+", "12+"] else "low"
                    }
                ] if categories else []
            }
        ]
    }

if __name__ == "__main__":
    try:
        # Читаем JSON из stdin
        input_data = sys.stdin.read()
        content = parse_json_simple(input_data)
        
        if not content:
            sys.stderr.write('{"error": "Пустое содержимое"}')
            sys.exit(1)
        
        # Анализируем
        result = analyze_scenario(content)
        
        # Выводим результат в stdout
        print(dict_to_json(result))
        sys.exit(0)
        
    except Exception as e:
        sys.stderr.write('{"error": "' + str(e).replace('"', '\\"') + '"}')
        sys.exit(1)
