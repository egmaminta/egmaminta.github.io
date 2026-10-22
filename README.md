# Emmanuel G. Maminta · Academic profile

Personal academic website at <https://egmaminta.github.io>, built with Jekyll and deployed to GitHub Pages. The custom layouts provide a consistent profile, publication list, writing index, archive, and article view. The Chirpy gem supplies the existing Jekyll plugins and feed.

## Local development

Use Ruby 3.3 and Bundler, matching the GitHub Actions workflow.

```sh
bundle install
bash tools/run.sh
```

Open <http://127.0.0.1:4000>. Restart the server after editing `_config.yml`.

### Inside a development container

From the repository root in the container terminal:

```sh
export BUNDLE_APP_CONFIG="$PWD/.bundle"
bundle config set --local path vendor/bundle
bundle install
bash tools/run.sh --host 0.0.0.0
```

Forward port **4000** and open <http://localhost:4000>. Port **35729** enables automatic browser refresh.

The container configuration sets writable paths for Bundler's configuration and installed gems, and forwards both ports. Its creation script installs the gems automatically. After changing `.devcontainer/devcontainer.json`, use **Dev Containers: Rebuild Container** to apply those defaults. The commands above also fix an existing container session without rebuilding.

If Bundler reports a permission error under `/usr/local/bundle`, rerun the `export` and `bundle config` commands above before installing. Both `.bundle/` and `vendor/` are ignored by Git.

## Updating content

- **Profile and research:** edit `index.html`.
- **CV:** the homepage links to `assets/cv/Maminta_Emmanuel_CV.pdf`. Edit `_cv/Emmanuel_G_Maminta_Academic_CV.tex` and run `bash _cv/build.sh` with XeLaTeX installed. Formatting follows the supplied [Stanford Career Center guide](https://careered.stanford.edu/sites/g/files/sbiybj22801/files/media/file/resume-and-cover-letter-examples.pdf): one-inch margins, a single column, conventional headings, and text larger than 10 points. The PDF has no URLs or embedded links. Build instructions are in `_cv/BUILD.txt`; Jekyll omits `_cv/` from published output.
- **News:** add entries to `_data/news.yml`, newest event first, using `Mon YYYY` labels (for example, `Sep 2026`). The first five are visible; the rest appear under “Earlier updates.” Use the supplied event month for upcoming conference presentations; leave unknown historical months unspecified.
- **Publications:** edit `_data/publications.yml`. Each entry supports `title`, `venue`, `context`, `authors` (Markdown), `url`, `badge`, `badge_url`, `highlight`, and a list of `links` with `label` and `url`. `highlight: true` emphasizes the ACCV main-conference oral presentation. Add the ACCV paper link when available.
- **Writing:** `/blog/` lists active posts and introduces the Robotics for Beginners learning journal. Add new chapters in `_posts/` without `archived: true`. The homepage shows the three latest active posts. The four older posts retain their URLs and `archived: true`; they remain at `/archives/`.
- **Robotics figures:** Chapter 1 uses `_includes/robotics/`, `assets/css/robotics.css`, and `assets/js/robotics.js`. Set `robotics: true` in chapter front matter to load those assets. The SVG diagrams preserve text labels and explanations remain readable without JavaScript. The planar chain calculates geometry for an illustration. The command figure illustrates changing a target while physics is paused. Experimental measurements remain pending until supported by a saved result file. The original course exercises remain separate from this website.
- **Writing fonts:** Graphik is preferred if locally installed; self-hosted Inter is the fallback. B612 Mono is used for code and values. Font sources and licenses are in `assets/fonts/`.
- **Preprints:** edit `_tabs/preprints.md`; PDFs live in `assets/preprints/`.
- **Certifications:** badge images are stored in `assets/img/certifications/` and displayed in `index.html`, with links to the public Credly verification pages.
- **Appearance:** `assets/css/academic.css` and `_layouts/`. The homepage uses a simple document layout, local assets, and [Yale Blue](https://medicine.yale.edu/myysm/communications-technology/ysm-brand/visual-identity/colors/) (`#00356b`) for links. The ACCV oral presentation has a subtle blue background without a border accent. Posts with math or diagrams load MathJax or Mermaid as needed.
- **Browser tab icon:** `assets/img/favicon.ico` contains the official UP Diliman site's 32px and 192px favicon artwork. The original 192px PNG is saved as `assets/img/up-diliman-logo.png`. Source: [UP Diliman](https://upd.edu.ph/wp-content/uploads/2020/06/cropped-upd-favicon-192x192.png).
- **Email and social profiles:** edit the contact details in `index.html`. Personal and academic email addresses are listed separately. The primary metadata email is set in `_config.yml`.

## Validation and deployment

```sh
bash tools/test.sh
```

This performs a production build and checks internal links, images, and scripts with HTML-Proofer. External destinations are excluded from this check.

Push to `main` or `master` to run the existing `.github/workflows/pages-deploy.yml` workflow. It builds, validates, and deploys the site to GitHub Pages. Local build output and installed dependencies are ignored by Git.

The layout supports narrow screens, keyboard navigation, reduced motion, and printing. The news archive and certification badges work without JavaScript.
