#!/usr/bin/env python3

from build_sys import *

import os
import os.path
import re
import sys

def main():
  config = local_config()
  validate_args()

  run_build_rule(':all')
  
  # deploy
  if not flag('test_only'):
    cmd('cp -r src/* {}'.format(config['out_dir']))
    if flag('deploy_data') or flag('deploy_all'):
      cmd('cp -r data/* {}'.format(config['out_dir']))
    if flag('deploy_dependencies') or flag('deploy_all'):
      print('no external dependencies')
      #dep_dir = os.path.join(config['out_dir'], 'dependencies')
      #cmd('mkdir -p {}'.format(dep_dir))
      #cmd('cp -r howler/dist/howler.core.min.js {}'.format(dep_dir))

if __name__ == '__main__':
  main()
