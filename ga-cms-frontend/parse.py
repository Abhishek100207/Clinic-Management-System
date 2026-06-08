import json

try:
    with open('report.json', encoding='utf-16') as f:
        content = f.read()
    if content.startswith('\ufeff'):
        content = content[1:]
    data = json.loads(content)
    for file_data in data:
        messages = file_data.get('messages', [])
        if len(messages) > 0:
            print(f"File: {file_data['filePath']}")
            for msg in messages:
                print(f"  Line {msg['line']}: {msg['message']} ({msg['ruleId']})")
except Exception as e:
    print(f"Error: {e}")
