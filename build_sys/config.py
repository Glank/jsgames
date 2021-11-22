import json
import os.path

def ensure_config_key(config, key, description, default_gen, value_constructor):
  '''returns True if the config was updated.'''
  if value_constructor is None:
    value_constructor = lambda x: x
  if key not in config:
    if description is not None:
      print('{}: {}'.format(key, description))
    default_value = default_gen() if default_gen else None
    if default_value is None:
      val = input('{}? '.format(key))
      if not val:
        raise Exception('Config value for {} not set.'.format(key))
      config[key] = value_constructor(val)
    else:
      val = input('{} [{}]? '.format(key, default_value))
      if not val:
        val = default_value
      config[key] = value_constructor(val)
    return True
  return False

def defualt_files(default_fns):
  def closure():
    for default_fn in default_fns:
      if os.path.exists(default_fn):
        return default_fn
    return None
  return closure

def construct_staging_dirs(user_input):
  return {'dev': user_input}

def local_config():
  config_fn = 'local_config.json'
  required_keys = [
    ('staging_dirs', 'The director(y|ies) to which finalized files are copied.', None, construct_staging_dirs),
    ('browserify_bin', 'A path to the browserify binary.', defualt_files([
      'npm_libs/node_modules/.bin/browserify',
      '/usr/bin/browserify',
      '/usr/local/bin/browserify',
    ]), None),
    ('uglifyjs_bin', 'A path to the uglifyjs binary.', defualt_files([
      'npm_libs/node_modules/.bin/uglifyjs',
      '/usr/bin/uglifyjs',
      '/usr/local/bin/uglifyjs',
    ]), None),
  ]
  config = {}
  if os.path.exists(config_fn):
    with open(config_fn) as f:
      config = json.load(f)

  config_updated = any(
    ensure_config_key(config, *params) for params in required_keys
  )

  if config_updated:
    with open(config_fn, 'w') as f:
      json.dump(config, f, indent='  ', sort_keys=True)
  return config
