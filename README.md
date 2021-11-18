# jsgames
Messing around in javascript and making some games.

## Building

First, install nodejs and npm
```
sudo apt-get install nodejs
```

Then install the npm libraries browserify and uglifyjs

```
mkdir npm_libs
cd npm_libs
npm install browserify
npm install uglify-js
```

Note down your staging directory, for example,
```
/var/www/static/jsgames
```

Then run ./make.py which will prompt you for your staging directory and your
browserify and uglifyjs binary paths if you didn't install them exactly as above.
```
{
  "staging_dir": "/var/www/static/jsgames",
  "browserify_bin": "npm_libs/node_modules/.bin/browserify",
  "uglifyjs_bin": "npm_libs/node_modules/.bin/uglifyjs"
}
```
