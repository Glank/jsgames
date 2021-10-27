export function assert(condition, message) {
  if(!condition){
    console.log(message)
    process.exit(1)
  }
}

export var TEST_APPROX_ERROR = 0.01;

export function approx(a, b, err) {
  if (!err) {
    err = TEST_APPROX_ERROR;
  }
  return Math.abs(b-a) < err;
}
