import json
import os.path

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

def local_config():
  config_fn = 'local_config.json'
  required_keys = [
    ('staging_dir', 'The directory to which finalized files are copied.', None),
    ('browserify_bin', 'A path to the browserify binary.', None),
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
