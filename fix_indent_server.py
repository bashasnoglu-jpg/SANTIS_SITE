with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

source = source.replace('event_dispatcher.stop()\n    intelligence_worker.stop()', '    event_dispatcher.stop()\n    intelligence_worker.stop()')

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(source)

print("Indentation fixed.")
