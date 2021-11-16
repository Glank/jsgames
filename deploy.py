#!/usr/bin/env python3

import json
import os
import os.path
import re
import sys

def ensure_config_key(config, key, description, default_value=None):
  '''returns True if the config was updated.'''
  if key not in config:
    if description is not None:
      print('{}: {}'.format(key, description))
    if default_value is None:
      val = input('{}? '.format(key))
      if not val:
        raise Exception('Config value for {} not set.'.format(key))
      config[key] = val
    else:
      val = input('{} [{}]? '.format(key, default_value))
      if not val:
        val = default_value
      config[key] = val
    return True
  return False

def get_config():
  config_fn = 'local_config.json'
  required_keys = [
    ('out_dir', 'The directory to which finalized files are copied.', None)
  ]
  config = {}
  if os.path.exists(config_fn):
    with open(config_fn) as f:
      config = json.load(f)

  config_updated = any(
    ensure_config_key(config, k, d, v) for k, d, v in required_keys
  )

  if config_updated:
    with open(config_fn, 'w') as f:
      json.dump(config, f, indent='  ', sort_keys=True)
  return config

FLAG_ARGS = [
  ('dry_run', '--dry'),
  ('quiet', '-q'),
  ('test_only', '--test'),
  ('deploy_data', '--data'),
  ('deploy_all', '--all'),
  ('deploy_dependencies', '--deps'),
]
FLAGS = dict((fa[0], False) for fa in FLAG_ARGS)

def cmd(cmd):
  global FLAGS
  if not FLAGS['quiet']:
    print(cmd)
  if not FLAGS['dry_run']:
    code = os.system(cmd)
    if code:
      print('Error executing: {}'.format(cmd))
      exit(1)

def validate_args():
  global FLAGS
  args = sys.argv[1:]
  for fa in FLAG_ARGS:
    key, arg = fa[0], fa[1]
    if arg in args:
      FLAGS[key] = True
      args.remove(arg) 
  assert len(args) == 0

def run_test(test_dir, test_fn):
  flags = get_config().get('nodejs_flags', '')
  cmd('nodejs {} {}'.format(flags, os.path.join(test_dir, test_fn)))

def run_tests():
  global FLAGS 
  if not FLAGS['quiet']:
    print('Running tests...')
  for dirpath, dirnames, filenames in os.walk('test'):
    for fn in filenames:
      if re.match(r'\w.*\.mjs', fn):
        run_test(dirpath, fn)
  if not FLAGS['quiet']:
    if FLAGS['dry_run']:
      print('Dry run of tests shown above. None were executed but all were successfully preprocessed.')
    else: 
      print('All tests passed.')

def main():
  global FLAGS 

  config = get_config()
  validate_args()

  # run tests
  run_tests()
  
  # deploy
  if not FLAGS['test_only']:
    cmd('cp -r src/* {}'.format(config['out_dir']))
    if FLAGS['deploy_data'] or FLAGS['deploy_all']:
      cmd('cp -r data/* {}'.format(config['out_dir']))
    if FLAGS['deploy_dependencies'] or FLAGS['deploy_all']:
      print('no external dependencies')
      #dep_dir = os.path.join(config['out_dir'], 'dependencies')
      #cmd('mkdir -p {}'.format(dep_dir))
      #cmd('cp -r howler/dist/howler.core.min.js {}'.format(dep_dir))

if __name__ == '__main__':
  main()
