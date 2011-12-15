#!/usr/bin/python

import os
from bottle import static_file, route, run, debug

debug(True)

@route('/:filename#.+#')
def server_static(filename):
  return static_file(filename, root=os.getcwd())

run(reloader=True, host='localhost', port=8012)
