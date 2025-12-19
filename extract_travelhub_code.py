#!/usr/bin/env python3
"""
Скрипт для извлечения всего кода из истории разработки TravelHub
"""
import json
import re
import os
from pathlib import Path
from collections import defaultdict

def extract_code_blocks(text):
    """Извлекает все блоки кода из текста"""
    # Паттерн для блоков кода с указанием языка
    pattern = r'```(\w+)?\n(.*?)```'
    matches = re.findall(pattern, text, re.DOTALL)
    return matches

def sanitize_filename(filename):
    """Очищает имя файла от недопустимых символов"""
    # Берем только первое слово/путь до пробела или точки с пробелом
    match = re.match(r'([^\s]+(?:\.\w+)?)', filename)
    if match:
        filename = match.group(1)

    # Удаляем недопустимые символы
    filename = re.sub(r'[<>:"|?*\x00-\x1f]', '_', filename)
    # Удаляем точку в конце (если это не расширение файла)
    if filename.endswith('.') and not re.search(r'\.\w+\.$', filename):
        filename = filename.rstrip('.')
    # Удаляем пробелы
    filename = filename.strip()
    # Если имя пустое, используем дефолтное
    if not filename or len(filename) < 2:
        filename = 'unnamed.txt'
    return filename

def determine_file_info(lang, code, context=""):
    """Определяет имя файла и путь на основе языка и содержимого"""

    # Проверяем, есть ли комментарий с именем файла в коде
    file_comment_patterns = [
        r'//\s*(?:File:|Файл:)\s*(.+)',
        r'#\s*(?:File:|Файл:)\s*(.+)',
        r'/\*\*?\s*(?:File:|Файл:)\s*(.+?)\s*\*/',
    ]

    for pattern in file_comment_patterns:
        match = re.search(pattern, code, re.IGNORECASE)
        if match:
            filename = sanitize_filename(match.group(1).strip())
            return filename

    # Проверяем контекст перед блоком кода
    context_patterns = [
        r'`([^`]+\.\w+)`',  # Файл в обратных кавычках
        r'файл[а-я\s]*[`"]?([^`"\n]+\.\w+)',  # "файл something.ext"
        r'создайте\s+([^`\n]+\.\w+)',
    ]

    for pattern in context_patterns:
        match = re.search(pattern, context, re.IGNORECASE)
        if match:
            filename = sanitize_filename(match.group(1).strip())
            return filename

    # Определяем расширение по языку
    lang_to_ext = {
        'typescript': '.ts',
        'tsx': '.tsx',
        'javascript': '.js',
        'jsx': '.jsx',
        'python': '.py',
        'html': '.html',
        'css': '.css',
        'json': '.json',
        'yaml': '.yml',
        'yml': '.yml',
        'markdown': '.md',
        'md': '.md',
        'bash': '.sh',
        'sh': '.sh',
        'dockerfile': 'Dockerfile',
        'sql': '.sql',
    }

    # Специальные случаи
    if 'package.json' in code:
        return 'package.json'
    elif 'tsconfig' in code.lower():
        return 'tsconfig.json'
    elif 'vite.config' in code:
        return 'vite.config.ts'
    elif 'tailwind.config' in code:
        return 'tailwind.config.js'
    elif 'docker-compose' in code.lower():
        return 'docker-compose.yml'
    elif code.strip().startswith('FROM '):
        return 'Dockerfile'

    ext = lang_to_ext.get(lang.lower(), '.txt') if lang else '.txt'
    return f"extracted_code{ext}"

def categorize_file(filename, code):
    """Определяет категорию файла для структуры папок"""
    filename_lower = filename.lower()

    # Проверяем содержимое
    if 'import React' in code or 'from "react"' in code or 'export default' in code:
        if 'component' in code.lower() or 'function' in code or 'const' in code:
            if 'page' in filename_lower or 'route' in code.lower():
                return 'frontend/src/pages'
            elif 'layout' in filename_lower or 'header' in filename_lower or 'footer' in filename_lower:
                return 'frontend/src/components/layout'
            elif 'feature' in filename_lower or 'search' in filename_lower:
                return 'frontend/src/components/features'
            else:
                return 'frontend/src/components'

    # Backend
    if 'express' in code or 'app.listen' in code or 'app.use' in code:
        return 'backend/src'

    # Конфигурация
    if filename in ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.js', '.env.example']:
        if 'frontend' in code or 'vite' in code or 'react' in code:
            return 'frontend'
        elif 'express' in code or 'node' in code:
            return 'backend'
        return 'config'

    # Docker
    if filename == 'Dockerfile' or 'docker-compose' in filename:
        if 'vite' in code or 'npm run dev' in code:
            return 'frontend'
        elif 'express' in code or 'node server' in code:
            return 'backend'
        return 'deployment'

    # Документация
    if filename.endswith('.md'):
        return 'documentation'

    # Стили
    if filename.endswith('.css'):
        return 'frontend/src/styles'

    # HTML
    if filename.endswith('.html'):
        return 'design'

    # Скрипты
    if filename.endswith('.sh'):
        return 'deployment/scripts'

    # Nginx
    if 'nginx' in filename_lower:
        return 'deployment/nginx'

    # SEO
    if filename in ['sitemap.xml', 'robots.txt']:
        return 'seo'

    # GitHub Actions
    if '.github' in filename or 'workflow' in filename or 'deploy.yml' in filename:
        return '.github/workflows'

    return 'misc'

def main():
    # Читаем разговор
    with open('/tmp/travelhub_main_conversation.json', 'r', encoding='utf-8') as f:
        conversation = json.load(f)

    print(f"Название: {conversation['name']}")
    print(f"Создан: {conversation['created_at']}")
    print(f"Сообщений: {len(conversation['chat_messages'])}")
    print()

    # Создаем выходную директорию
    output_dir = Path('/home/user/daten3/travelhub-full-extracted')
    output_dir.mkdir(exist_ok=True)

    # Статистика
    files_by_category = defaultdict(list)
    total_files = 0
    total_lines = 0

    # Обрабатываем каждое сообщение
    for i, msg in enumerate(conversation['chat_messages']):
        if msg['sender'] != 'assistant':
            continue

        text = msg.get('text', '')

        # Извлекаем блоки кода
        code_blocks = extract_code_blocks(text)

        # Получаем контекст (текст перед блоком кода)
        contexts = text.split('```')

        for j, (lang, code) in enumerate(code_blocks):
            if not code.strip():
                continue

            # Получаем контекст для этого блока
            context_idx = j * 2
            context = contexts[context_idx] if context_idx < len(contexts) else ""

            # Определяем имя файла
            filename = determine_file_info(lang, code, context)

            # Категоризируем файл
            category = categorize_file(filename, code)

            # Создаем полный путь
            file_dir = output_dir / category
            file_dir.mkdir(parents=True, exist_ok=True)

            # Если файл с таким именем уже существует, добавляем суффикс
            base_name = filename
            counter = 1
            file_path = file_dir / filename
            while file_path.exists():
                name, ext = os.path.splitext(base_name)
                filename = f"{name}_v{counter}{ext}"
                file_path = file_dir / filename
                counter += 1

            # Сохраняем файл
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(code)

            lines = len(code.split('\n'))
            total_files += 1
            total_lines += lines
            files_by_category[category].append({
                'filename': filename,
                'lines': lines,
                'lang': lang or 'unknown'
            })

            print(f"[{i+1}/{len(conversation['chat_messages'])}] Извлечен: {category}/{filename} ({lines} строк)")

    # Выводим статистику
    print("\n" + "="*60)
    print("СТАТИСТИКА ИЗВЛЕЧЕНИЯ")
    print("="*60)
    print(f"Всего файлов: {total_files}")
    print(f"Всего строк кода: {total_lines}")
    print(f"\nФайлов по категориям:")

    for category in sorted(files_by_category.keys()):
        files = files_by_category[category]
        total_category_lines = sum(f['lines'] for f in files)
        print(f"\n  {category}/ ({len(files)} файлов, {total_category_lines} строк)")
        for file_info in files:
            print(f"    - {file_info['filename']} ({file_info['lines']} строк, {file_info['lang']})")

    print(f"\nВсе файлы сохранены в: {output_dir}")

if __name__ == '__main__':
    main()
