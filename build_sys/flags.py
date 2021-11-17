import sys

FLAG_ARGS = [
  ('dry_run', '--dry'),
  ('quiet', '-q'),
  ('test_only', '--test'),
  ('deploy_data', '--data'),
  ('deploy_all', '--all'),
  ('deploy_dependencies', '--deps'),
]
ARGS_VALIDATED = False
FLAGS = dict((fa[0], False) for fa in FLAG_ARGS)

def print_help():
  global FLAG_ARGS
  #TODO: add help docs for each flag
  for key, flag in FLAG_ARGS:
    print('{}: {}'.format(key, flag))
  exit()

def validate_args():
  """ populates FLAGS and validate command line arguments """
  global FLAGS, ARGS_VALIDATED
  args = sys.argv[1:]
  if '--help' in args:
    print_help()
  for fa in FLAG_ARGS:
    key, arg = fa[0], fa[1]
    if arg in args:
      FLAGS[key] = True
      args.remove(arg) 
  assert len(args) == 0
  ARGS_VALIDATED = True

def flag(key):
  global FLAGS, ARGS_VALIDATED
  if not ARGS_VALIDATED:
    raise Exception("Args not validated. Must all flags.validate_args")
  return FLAGS[key]
