import importlib, traceback
try:
    m = importlib.import_module('app.routes.chamudini.chamudini')
    print('Imported module:', m)
    print('Router exists:', hasattr(m, 'router'))
except Exception:
    traceback.print_exc()
