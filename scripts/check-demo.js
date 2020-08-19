#!/usr/bin/env node

const {
  existsSync,
  readFileSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} = require("fs");
const fsExtra = require("fs-extra");
const { join } = require("path");
const { loadFront } = require("yaml-front-matter");
const axios = require("axios").default;

const themesFolder = join(__dirname, "../content/theme");
const themeFiles = readdirSync(themesFolder);
const root = process.cwd();

if (!existsSync(`${root}/data`)) {
  mkdirSync(`${root}/data`);
}

const processTheme = async (theme) => {
  if (theme.startsWith("_")) {
    return;
  }

  const frontmatter = loadFront(readFileSync(join(themesFolder, theme)));
  const themeJsonFilename = `data/${theme
    .replace(".md", "")
    .replace(/\-/g, "_")}.json`;

  if (frontmatter.disabled) {
    console.log("No FrontMatter data, skipping");
    return;
  }

  let url = "";

  if (frontmatter.demo) {
    url = frontmatter.demo;
  }
  if (frontmatter.audit) {
    url = frontmatter.audit;
  }

  if (existsSync(themeJsonFilename)) {
    try {
      JSON.parse(readFileSync(themeJsonFilename));
    } catch (er) {
      // Invalid JSON
      unlinkSync(themeJsonFilename);
    }
  }

  let resp;
  try {
    console.log(`Checkin ${url}`);
    resp = await axios.get(url);
    // console.log(resp);

    if (!resp || 200 > resp.status > 300) {
      fsExtra.move(
        join(themesFolder, theme),
        join("unpublished_content", theme)
      );
    }
  } catch (error) {
    fsExtra.move(join(themesFolder, theme), join("unpublished_content", theme));
  }
};

(async () => {
  for await (const theme of themeFiles) {
    processTheme(theme);
  }
})();
