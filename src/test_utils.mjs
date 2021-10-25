export function assert(condition, message) {
  if(!condition){
    console.log(message)
    process.exit(1)
  }
}
