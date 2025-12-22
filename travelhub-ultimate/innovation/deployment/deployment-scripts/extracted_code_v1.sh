# Установить Artillery
npm install -g artillery

# Запустить load test
artillery run tests/performance/load-test.yml

# Запустить с отчётом
artillery run --output report.json tests/performance/load-test.yml
artillery report report.json
