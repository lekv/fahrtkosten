#!/usr/bin/python
# Copyright 2011 Lars Volker <lv@lekv.de>
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#     Unless required by applicable law or agreed to in writing, software
#     distributed under the License is distributed on an "AS IS" BASIS,
#     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#     See the License for the specific language governing permissions and
#     limitations under the License.

import os
from bottle import static_file, route, run, debug

debug(True)

@route('/')
def index():
  return server_static("index.html")

@route('/:filename#.+#')
def server_static(filename):
  return static_file(filename, root=os.getcwd())

run(reloader=True, host='localhost', port=8012)
