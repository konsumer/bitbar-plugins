# bitbar-plugins

Bitbar plugins I use


These are [Bitbar](https://github.com/matryer/bitbar) plugins I use. They have no dependencies other than nodejs, so you should be able to just drop them into your bitbar plugin dir.

Everything is configured with environment varianbles, which can be tricky in OSX app-space.

You can set OSX environment-variables with [these instructions](https://apple.stackexchange.com/questions/267025/set-environment-variable-for-applications-on-startup)

You can also use `launchctl setenv NAME VALUE` to set them one-off.


## gitlab_ci.10s.js

If you have `GITLAB_KEY` set in your environment, you can watch all your starred repos on gitlab for CI status.

You can get your token under your face (top-right) / Settings / Access Tokens
