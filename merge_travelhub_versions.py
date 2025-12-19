#!/usr/bin/env python3
"""
Скрипт для объединения всех версий TravelHub в одну полную расширенную версию
"""
import os
import shutil
from pathlib import Path
from collections import defaultdict
import hashlib

def get_file_hash(filepath):
    """Вычисляет SHA256 хеш файла"""
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for block in iter(lambda: f.read(4096), b''):
                sha256.update(block)
        return sha256.hexdigest()
    except:
        return None

def merge_directories(source_dirs, dest_dir, priority_order):
    """
    Объединяет несколько директорий в одну,
    priority_order определяет приоритет при конфликтах (первый = высший приоритет)
    """
    dest_path = Path(dest_dir)
    dest_path.mkdir(parents=True, exist_ok=True)

    # Словарь для отслеживания файлов: путь -> (источник, размер, хеш)
    files_registry = {}

    # Проходим по источникам в порядке приоритета
    for i, source_dir in enumerate(priority_order):
        if source_dir not in source_dirs:
            continue

        source_path = Path(source_dirs[source_dir])
        if not source_path.exists():
            print(f"⚠️  Пропускаем {source_dir}: директория не существует")
            continue

        print(f"\n{'='*60}")
        print(f"Обработка: {source_dir}")
        print(f"{'='*60}")

        # Рекурсивно обходим все файлы
        for root, dirs, files in os.walk(source_path):
            for filename in files:
                source_file = Path(root) / filename

                # Вычисляем относительный путь
                try:
                    rel_path = source_file.relative_to(source_path)
                except ValueError:
                    continue

                dest_file = dest_path / rel_path

                # Получаем информацию о файле
                file_size = source_file.stat().st_size
                file_hash = get_file_hash(source_file)

                # Определяем, копировать ли файл
                should_copy = False
                reason = ""

                rel_path_str = str(rel_path)

                if rel_path_str not in files_registry:
                    # Новый файл
                    should_copy = True
                    reason = "НОВЫЙ"
                    files_registry[rel_path_str] = (source_dir, file_size, file_hash)
                else:
                    # Файл уже существует, проверяем
                    existing_source, existing_size, existing_hash = files_registry[rel_path_str]

                    if file_hash != existing_hash:
                        # Файлы разные
                        if file_size > existing_size:
                            # Новый файл больше - берем его
                            should_copy = True
                            reason = f"БОЛЬШЕ (было {existing_size} байт из {existing_source})"
                            files_registry[rel_path_str] = (source_dir, file_size, file_hash)
                        elif file_size < existing_size:
                            # Новый файл меньше - пропускаем
                            reason = f"МЕНЬШЕ (оставляем {existing_size} байт из {existing_source})"
                        else:
                            # Размер одинаковый, но содержимое разное
                            # Берем из источника с более высоким приоритетом
                            if i < priority_order.index(existing_source):
                                should_copy = True
                                reason = f"ПРИОРИТЕТ (было из {existing_source})"
                                files_registry[rel_path_str] = (source_dir, file_size, file_hash)
                            else:
                                reason = f"ДУБЛИКАТ (оставляем из {existing_source})"
                    else:
                        # Файлы идентичны
                        reason = f"ИДЕНТИЧЕН ({existing_source})"

                if should_copy:
                    # Создаем директорию, если нужно
                    dest_file.parent.mkdir(parents=True, exist_ok=True)
                    # Копируем файл
                    shutil.copy2(source_file, dest_file)
                    print(f"  ✅ {rel_path} [{reason}]")
                else:
                    print(f"  ⏭️  {rel_path} [{reason}]")

    return files_registry

def organize_extracted_files(extracted_dir, organized_dir):
    """
    Реорганизует извлеченные файлы из misc/ в правильную структуру
    на основе их содержимого и имен
    """
    extracted_path = Path(extracted_dir)
    organized_path = Path(organized_dir)
    organized_path.mkdir(parents=True, exist_ok=True)

    # Копируем структуру "как есть", но улучшаем организацию misc/
    misc_path = extracted_path / 'misc'
    if misc_path.exists():
        print(f"\n{'='*60}")
        print("Реорганизация файлов из misc/")
        print(f"{'='*60}")

        for file_path in misc_path.iterdir():
            if not file_path.is_file():
                continue

            # Пытаемся определить правильное место для файла
            dest_subdir = None
            filename = file_path.name

            # Читаем начало файла для определения типа
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content_start = f.read(500)

                # TypeScript компоненты
                if 'React' in content_start or 'export' in content_start:
                    if 'Page' in content_start or 'route' in content_start.lower():
                        dest_subdir = 'frontend/src/pages'
                    else:
                        dest_subdir = 'frontend/src/components'
                # Backend
                elif 'express' in content_start.lower() or 'app.listen' in content_start:
                    dest_subdir = 'backend/src'
                # Конфигурация
                elif filename.endswith('.json') or filename.endswith('.yml'):
                    dest_subdir = 'config'
                # Docker
                elif 'FROM ' in content_start or 'docker' in filename.lower():
                    dest_subdir = 'deployment'
                # Scripts
                elif filename.endswith('.sh'):
                    dest_subdir = 'deployment/scripts'
                # Документация
                elif filename.endswith('.md'):
                    dest_subdir = 'documentation'
            except:
                pass

            # Если не смогли определить, оставляем в misc
            if not dest_subdir:
                dest_subdir = 'misc'

            # Копируем файл
            dest_file = organized_path / dest_subdir / filename
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file_path, dest_file)
            print(f"  📁 {filename} → {dest_subdir}/")

    # Копируем остальные директории как есть
    for item in extracted_path.iterdir():
        if item.name == 'misc' or not item.is_dir():
            continue

        dest = organized_path / item.name
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(item, dest)
        print(f"  📂 {item.name}/ скопирована")

def main():
    print("🚀 ОБЪЕДИНЕНИЕ ВСЕХ ВЕРСИЙ TRAVELHUB")
    print("=" * 60)

    # Определяем источники
    source_dirs = {
        'extracted': '/home/user/daten3/travelhub-full-extracted',
        'v1.0': '/home/user/daten3/travelhub-v1.0/travelhub-complete',
        'v1.1': '/home/user/daten3/travelhub-v1.1/travelhub-complete',
    }

    # Сначала реорганизуем извлеченные файлы
    organized_extracted = '/home/user/daten3/travelhub-extracted-organized'
    print("\nЭтап 1: Реорганизация извлеченных файлов")
    organize_extracted_files(source_dirs['extracted'], organized_extracted)

    # Обновляем путь к извлеченным файлам
    source_dirs['extracted'] = organized_extracted

    # Приоритет: сначала v1.1 (самая полная официальная версия),
    # затем извлеченная (может содержать дополнительный код),
    # затем v1.0 (базовая версия)
    priority_order = ['v1.1', 'extracted', 'v1.0']

    # Создаем финальную директорию
    final_dir = '/home/user/daten3/travelhub-ultimate'
    print(f"\nЭтап 2: Объединение версий")
    print(f"Приоритет: {' > '.join(priority_order)}")

    files_registry = merge_directories(source_dirs, final_dir, priority_order)

    # Выводим статистику
    print(f"\n{'='*60}")
    print("ИТОГОВАЯ СТАТИСТИКА")
    print(f"{'='*60}")

    stats_by_source = defaultdict(int)
    stats_by_category = defaultdict(list)

    for file_path, (source, size, _) in files_registry.items():
        stats_by_source[source] += 1
        category = str(Path(file_path).parts[0]) if Path(file_path).parts else 'root'
        stats_by_category[category].append((file_path, source, size))

    print(f"\nВсего файлов: {len(files_registry)}")
    print(f"\nИсточники файлов:")
    for source in priority_order:
        count = stats_by_source.get(source, 0)
        print(f"  {source}: {count} файлов")

    print(f"\nФайлов по категориям:")
    for category in sorted(stats_by_category.keys()):
        files = stats_by_category[category]
        total_size = sum(size for _, _, size in files)
        print(f"\n  {category}/ ({len(files)} файлов, {total_size:,} байт)")

        # Показываем источники для этой категории
        source_counts = defaultdict(int)
        for _, source, _ in files:
            source_counts[source] += 1
        for source in priority_order:
            if source in source_counts:
                print(f"    - из {source}: {source_counts[source]} файлов")

    print(f"\n✅ Полная расширенная версия TravelHub создана в:")
    print(f"   {final_dir}")
    print(f"\nГотово к использованию! 🎉")

if __name__ == '__main__':
    main()
