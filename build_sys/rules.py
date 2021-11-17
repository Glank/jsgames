from .command import cmd
from .files import *
from .flags import flag
from .config import local_config

import os.path
import json
import re

def needs_to_run(rule_config):
  return max_modify_time(rule_config.get('in', [])) > min_modify_time(rule_config.get('out', []))

def parse_path(rule_path):
  m = re.match(r'([^:]*):([^:]+)$', rule_path)
  if not m:
    raise Exception('Invalid rule path: {}'.format(rule_path))
  return m.groups()

def run_build_rule(rule_path, visited=None):
  global RULES
  # ensure that this rule isn't part of a cyclical chain
  if visited is None:
    visited = set()
  if rule_path in visited:
    raise Exception('Rule {} already visited! Cyclical dep chain detected.'.format(rule_path))
  visited.add(rule_path)
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
  # if we don't need to run, proceed without building
  if not rule_config.get('always_run', False) and not needs_to_run(rule_config):
    return
  if not flag('quiet'):
    print('Building {}...'.format(rule_path))
  # build any necessary dependencies recursively first
  for dep in rule_config.get('deps', []):
    run_build_rule(dep, visited=visited)
  # ensure all output file directories exist
  for out_fp in rule_config.get('out', []):
    out_dir, out_fn = os.path.split(out_fp)
    ensure_dir(out_dir)
  # build this rule
  if rule_config.get('rule', 'noop') not in RULES:
    raise Exception('Unknown build rule {} for {}'.format(rule_config['rule'], rule_path))
  RULES[rule_config.get('rule', 'noop')](rule_config)
  # verify that the output was generated
  if 'out' in rule_config and needs_to_run(rule_config) and not flag('dry_run'):
    raise Exception('Not all outputs were generated successfully for {}'.format(rule_path))

def js_test(config):
  flags = local_config().get('nodejs_flags', '')
  cmd('nodejs {} {}'.format(flags, config['in'][0]))
  cmd('touch {}'.format(config['out'][0]))

def noop(config):
  pass

def pack_js_module(config):
  # TODO
  pass

def pack_js_web(config):
  # TODO
  pass

RULES = {
  'js_test': js_test,
  'noop': noop,
  'pack_js_module': pack_js_module,
  'pack_js_web': pack_js_web,
}
