# Projects

A site to showcase most of my creations.


# Development status

Under development.


# Technical notes

The site is stored in `docs/` because this and root are the only folders GitHub
allows building from in GitHub Pages' settings. And I prefer having it in a
subfolder rather than in the root directory.

No third-party framework is involved. This is raw HTML-CSS-JS. There are only a
few own-made tasks.


# Testing locally

Before being able to start the server locally, you need to add a symlink in docs, wich will let have paths like those on Github Pages due to the fact that the repository name is added just after domain name.

To do this, go to docs with console and use :
- Windows : `mklink /d "projects" "."`
- Linux : I am not sure, but take a look at the `ln` command with `-s` option, and create a symlink called `projects` in `docs/` redirecting toward `.` (current folder, AKA `docs/` because `docs/projects` will result the same as `docs/.`).

To test locally, start the server from `docs/`.