import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = join(root, "node_modules/@tauri-apps/cli/tauri.js");
const icons = join(root, "src-tauri/icons");
const logo = readFileSync(join(root, "public/quizzy-logo.svg"), "utf8");
const temporary = mkdtempSync(join(tmpdir(), "quizzy-icons-"));

function generate(source, output, sizes = []) {
  execFileSync(process.execPath, [cli, "icon", source, "--output", output,
    ...sizes.flatMap((size) => ["--png", String(size)])], { cwd: root, stdio: "inherit" });
}

function nativeSource(padding) {
  const size = 1024 - padding * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">\n${logo.replace('width="64" height="64"', `x="${padding}" y="${padding}" width="${size}" height="${size}"`)}\n</svg>\n`;
}

try {
  copyFileSync(join(root, "public/quizzy-logo.svg"), join(root, "public/favicon.svg"));
  generate(join(root, "public/quizzy-logo.svg"), temporary, [1024]);
  copyFileSync(join(temporary, "1024x1024.png"), join(root, "public/quizzy-logo.png"));

  const appSource = join(icons, "quizzy-app-icon.svg");
  // Keep a small safe margin without shrinking the icon in the Dock.
  writeFileSync(appSource, nativeSource(48));
  generate(appSource, icons);

  const windowsSource = join(icons, "quizzy-windows-icon.svg");
  writeFileSync(windowsSource, nativeSource(48));
  generate(windowsSource, join(temporary, "windows"));
  copyFileSync(join(temporary, "windows/icon.ico"), join(icons, "icon.ico"));
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
