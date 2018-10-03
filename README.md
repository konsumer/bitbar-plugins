# bitbar-plugins

Bitbar plugins I use


These are [Bitbar](https://github.com/matryer/bitbar) plugins I use. They have no dependencies other than nodejs, so you should be able to just drop them into your bitbar plugin dir.

Everything is configured with environment varianbles, which can be tricky in OSX app-space.

## gitlab_ci.10s.js

Watch one Gitlab project's CI status. 

You need to configure `GITLAB_API_KEY` and `GITLAB_PROJECT` at top of file.

`GITLAB_PROJECT` should be the fullname (`GITLAB_USER/PROJECT_NAME`.)

I copy the same script into my bitbar plugin dir for every project I watch.