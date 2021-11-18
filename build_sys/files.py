from .command import cmd

import os, os.path
import glob

def modify_time(fn):
  if os.path.exists(fn):
    return os.stat(fn).st_mtime
  return 0

def max_modify_time(files):
  files = [f for f in files if os.path.exists(f)]
  if not files:
    return 0
  return max(os.stat(f).st_mtime for f in files)

def min_modify_time(files):
  if not files or any(not os.path.exists(f) for f in files):
    return 0
  return min(os.stat(f).st_mtime for f in files)

def ensure_dir(directory):
  if not os.path.exists(directory):
    cmd('mkdir -p {}'.format(directory))

def deglob(files):
  """
  Given a list of files and globs, returns all the files and any files in the globs.
  """
  new_files = []
  for fn_or_glob in files:
    found = False
    for fn in glob.glob(fn_or_glob):
      new_files.append(fn)
      found = True
    if not found:
      raise Exception('Pattern {} did not match any files.'.format(fn_or_glob))
  return new_files
