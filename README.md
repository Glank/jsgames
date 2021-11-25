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

Download, then symlink the media director.

```
cd /home/ejk
git clone ejk@ernestmakes.com:/home/ejk/media.git
ln -s /home/ejk/media /home/ejk/jsgames/media
```

Note down your staging directories, for example,

```
/var/www/static/jsgames
```

Then run `python3 mymake` which will prompt you for your staging directory and your
browserify and uglifyjs binary paths if you didn't install them exactly as above.

```
{
  "staging_dirs": {
    "dev": "/var/www/static/jsgames",
    "prod": "../ernestmakes/static/jsgames_v0_0",
    "media": "../ernestmakes/static/jsgames_media"
  },
  "browserify_bin": "npm_libs/node_modules/.bin/browserify",
  "uglifyjs_bin": "npm_libs/node_modules/.bin/uglifyjs"
}
```
