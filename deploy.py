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

DRY_RUN = False
VERBOSE = True

def cmd(cmd):
  global DRY_RUN, VERBOSE
  if VERBOSE:
    print(cmd)
  if not DRY_RUN:
    code = os.system(cmd)
    if code:
      print('Error executing: {}'.format(cmd))
      exit(1)

def validate_args():
  global DRY_RUN, VERBOSE
  args = sys.argv[1:]
  if '--dry' in args:
    DRY_RUN = True
    args.remove('--dry') 
  if '-q' in args:
    VERBOSE = False
    args.remove('-q') 
  assert len(args) == 0

def preprocess(input_file, output_file):
  includes_pattern = re.compile(r'\s*#include\s+(.*)')
  for line in input_file:
    inc = includes_pattern.match(line)
    if inc:
      with open(inc.group(1)) as f:
        output_file.write(f.read())
      output_file.write('\n')
    else:
      output_file.write(line)
      output_file.write('\n')

def run_test(test_dir, test_fn):
  bin_dir = os.path.join('bin/', test_dir)
  os.makedirs(bin_dir, exist_ok=True)
  with open(os.path.join(test_dir, test_fn)) as in_f:
    with open(os.path.join(bin_dir, test_fn), 'w') as out_f:
      preprocess(in_f, out_f)
  cmd('nodejs {}'.format(os.path.join(bin_dir, test_fn)))

def run_tests():
  global VERBOSE, DRY_RUN
  if VERBOSE:
    print('Running tests...')
  for dirpath, dirnames, filenames in os.walk('test'):
    for fn in filenames:
      if re.match(r'\w.*\.js', fn):
        run_test(dirpath, fn)
  if VERBOSE:
    if DRY_RUN:
      print('Dry run of tests shown above. None were executed but all were successfully preprocessed.')
    else: 
      print('All tests passed.')

def main():
  config = get_config()
  validate_args()

  # run tests
  run_tests()
  
  # deploy
  cmd('cp -r src/* {}'.format(config['out_dir']))
  

if __name__ == '__main__':
  main()
