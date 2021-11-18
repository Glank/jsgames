import sys

FLAG_ARGS = [
  ('dry_run', '--dry'),
  ('quiet', '-q'),
]
ARGS_VALIDATED = False
FLAGS = dict((fa[0], False) for fa in FLAG_ARGS)
TARGET = ':all'

def print_help():
  global FLAG_ARGS
  #TODO: add help docs for each flag
  for key, flag in FLAG_ARGS:
    print('{}: {}'.format(key, flag))
  exit()

def validate_args():
  """ populates FLAGS and validate command line arguments """
  global FLAGS, ARGS_VALIDATED, TARGET
  args = sys.argv[1:]
  if '--help' in args:
    print_help()
  for fa in FLAG_ARGS:
    key, arg = fa[0], fa[1]
    if arg in args:
      FLAGS[key] = True
      args.remove(arg) 
  if len(args) == 1 and ':' in args[0]:
    TARGET = args[0]
    args.pop()
  assert len(args) == 0
  ARGS_VALIDATED = True

def build_target():
  global TARGET
  return TARGET

def flag(key):
  global FLAGS, ARGS_VALIDATED
  if not ARGS_VALIDATED:
    raise Exception("Args not validated. Must all flags.validate_args")
  return FLAGS[key]
