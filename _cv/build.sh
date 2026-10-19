#!/usr/bin/env bash
set -euo pipefail

cv_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(dirname -- "$cv_dir")"
build_dir="$(mktemp -d "${TMPDIR:-/tmp}/maminta-cv.XXXXXX")"
trap 'rm -rf -- "$build_dir"' EXIT
cv_name="Emmanuel_G_Maminta_Academic_CV"

for pass in 1 2; do
  if ! xelatex -interaction=nonstopmode -halt-on-error \
    -output-directory="$build_dir" "$cv_dir/$cv_name.tex" > "$build_dir/pass-$pass.txt"; then
    cat "$build_dir/pass-$pass.txt"
    exit 1
  fi
done

if rg -n 'Overfull|Underfull|undefined references' "$build_dir/$cv_name.log"; then
  exit 1
fi

mkdir -p "$repo_dir/assets/cv"
cp -- "$build_dir/$cv_name.pdf" "$repo_dir/assets/cv/Maminta_Emmanuel_CV.pdf"
cp -- "$build_dir/$cv_name.pdf" "$cv_dir/$cv_name.pdf"
printf '%s\n' 'Built assets/cv/Maminta_Emmanuel_CV.pdf'
