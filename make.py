#!/usr/bin/env python3

from build_sys import *

import os
import os.path
import re
import sys

def main():
  config = local_config()
  validate_args()

  run_build_rule(build_target())

if __name__ == '__main__':
  main()
