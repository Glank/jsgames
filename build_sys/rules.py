from .command import cmd
from .files import *
from .flags import flag
from .config import local_config

import os.path
import json
import re

def input_older_than_output(rule_config):
  return max_modify_time(rule_config['in']) > min_modify_time(rule_config['out'])

def needs_to_run(rule_config):
  global ALWAYS_RUN
  if rule_config['rule'] in ALWAYS_RUN or rule_config.get('always_run', False):
    return True
  return input_older_than_output(rule_config)

def validate_output(rule_config):
  global VALIDATE_OUTPUT
  if rule_config['rule'] not in VALIDATE_OUTPUT or flag('dry_run'):
    return
  if input_older_than_output(rule_config):
    raise Exception('Not all outputs were generated successfully.')

def parse_path(rule_path):
  m = re.match(r'([^:]*):([^:]+)$', rule_path)
  if not m:
    raise Exception('Invalid rule path: {}'.format(rule_path))
  return m.groups()

def run_build_rule(rule_path, visited=None):
  global RULES
  # ensure that this rule isn't part of a cyclical chain
  if visited is None:
    visited = []
  if rule_path in visited:
    raise Exception('Rule {} already visited! Cyclical dep chain detected.'.format(rule_path))
  visited = visited+[rule_path]
  rule_dir, rule_name = parse_path(rule_path)
  # pen the correct build rule list
  config_fn = os.path.join(rule_dir, 'build.json')
  with open(config_fn) as f:
    rule_list = json.load(f)
  # select the rule config with the correct name
  rule_configs = [rc for rc in rule_list if rc['name'] == rule_name]
  if not rule_configs:
    raise Exception('Could not find rule {} in config file {}'.format(rule_name, config_fn))
  if len(rule_configs) > 1:
    raise Exception('Muliple instance of rule {} in config file {}'.format(rule_name, config_fn))
  rule_config = rule_configs[0]
  # do some sanity checking on the config before proceeding
  for key in rule_config:
    if key not in ['in', 'out', 'deps', 'name', 'rule', 'params', 'always_run']:
      raise Exception('Unknown key in rule config {}, {}'.format(rule_path, key))
  # build any necessary dependencies recursively first
  rule_config['deps'] = rule_config.get('deps', [])
  for dep in rule_config['deps']:
    run_build_rule(dep, visited=visited)
  # set defaults for easier handling by util functions
  rule_config['in'] = deglob(rule_config.get('in', []))
  rule_config['out'] = rule_config.get('out', [])
  rule_config['rule'] = rule_config.get('rule', 'noop')
  # if we don't need to run, proceed without building
  if not needs_to_run(rule_config):
    return
  if not flag('quiet'):
    print('{}'.format(rule_path))
  # ensure all output file directories exist
  for out_fp in rule_config['out']:
    out_dir, out_fn = os.path.split(out_fp)
    ensure_dir(out_dir)
  # build this rule
  if rule_config['rule'] not in RULES:
    raise Exception('Unknown build rule {} for {}'.format(rule_config['rule'], rule_path))
  RULES[rule_config['rule']](rule_config)
  # verify that the output was generated
  validate_output(rule_config)

def js_test(config):
  assert len(config['in']) >= 1
  assert len(config['out']) == 1
  flags = local_config().get('nodejs_flags', '')
  cmd('nodejs {} {}'.format(flags, config['in'][0]))
  cmd('touch {}'.format(config['out'][0]))

def noop(config):
  pass

def browserify(config):
  assert len(config['in']) >= 1
  assert len(config['out']) == 1
  browserify = local_config()['browserify_bin']
  in_fn = config['in'][0]
  out_fn = config['out'][0]
  cmd('{} {} -o {}'.format(browserify, in_fn, out_fn))

def stage(config):
  dest_dir = local_config()['staging_dir']
  subdir = config.get('params', {}).get('subdir', '')
  if subdir:
    dest_dir = os.path.join(dest_dir, subdir)
  ensure_dir(dest_dir)
  for src_fn in config['in']:
    _, fn = os.path.split(src_fn)
    dest_fn = os.path.join(dest_dir, fn)
    if modify_time(dest_fn) < modify_time(src_fn):
      cmd('cp {} {}'.format(src_fn, dest_fn))

RULES = {
  'js_test': js_test,
  'noop': noop,
  'browserify': browserify,
  'stage': stage,
}
ALWAYS_RUN = set([
  'noop',
  'stage',
])
VALIDATE_OUTPUT = set([
  'browserify',
])
