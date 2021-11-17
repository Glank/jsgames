from .flags import flag

import os

def cmd(cmd):
  if not flag('quiet'):
    print(cmd)
  if not flag('dry_run'):
    code = os.system(cmd)
    if code:
      print('Error executing: {}'.format(cmd))
      exit(1)
