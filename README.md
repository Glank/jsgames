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

Set your staging directories in a new file named local_config.json, for example,

```
{
  "staging_dirs": {
    "dev": "/var/www/static/jsgames",
    "prod": "../ernestmakes/static/jsgames_v0_0",
    "media": "../ernestmakes/static/jsgames_media"
  }
}
```

Download the build system:

```
git submodule update --init --recursive
```

Then run `python3 mymake` which will prompt you for your browserify and uglifyjs binary paths,
though it should have good defaults if you followed the rules above.

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
