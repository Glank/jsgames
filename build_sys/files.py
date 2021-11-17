from .command import cmd

import os, os.path

def max_modify_time(files):
  files = [f for f in files if os.path.exists(f)]
  if not files:
    return 0
  return max(os.stat(f).st_mtime for f in files)

def min_modify_time(files):
  if any(not os.path.exists(f) for f in files):
    return 0
  return min(os.stat(f).st_mtime for f in files)

def ensure_dir(directory):
  cmd('mkdir -p {}'.format(directory))
