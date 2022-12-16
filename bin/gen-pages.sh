#!/bin/bash

function generate_standalone_tpl {
  while read -r line; do 
    if echo "$line" | grep -E -q "<link|<script"; then
      file_name=$(echo "$line" | sed -r 's/^.*<[link|script].*(href|src)="([^"]*)".*>$/\2/');
      if echo "$line" | grep -E -q "<link"; then
        line="<style>$(cat "$file_name" )</style>";
      else 
        line="<script>$(cat "$file_name" )</script>";
      fi
    fi
    echo "$line" 
  done < index.html
}

function generate_index_tpl {
  cat templates/header-start.html
  cat templates/header-viewport.html
  cat templates/header-meta.html
  cat templates/header-css-min.html
  cat templates/header-end.html
  cat templates/body-start.html
  cat templates/body-plot.html
  cat templates/body-junit-input.html
  cat templates/body-out-json.html
  cat templates/body-out-html.html
  cat templates/body-result.html
  cat templates/body-settings.html
  cat templates/body-script-parser.html
  cat templates/body-end.html
}

function generate_index_test_tpl {
  cat templates/header-start.html
  cat templates/header-test-meta.html
  cat templates/header-css-min.html
  cat templates/header-end.html
  cat templates/body-start.html
  cat templates/body-plot.html
  cat templates/body-test-start.html
  cat templates/body-out-json.html
  cat templates/body-out-html.html
  cat templates/body-result.html
  cat templates/body-settings.html
  cat templates/body-test-end.html
  cat templates/body-script-test.html
  cat templates/body-end.html
}

generate_index_tpl > index.html
generate_standalone_tpl > index.sa.html
generate_index_test_tpl > test/index.html
