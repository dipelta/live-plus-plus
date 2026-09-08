const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const electronDir = path.join(__dirname, '..', 'node_modules', 'electron');
const pathFile = path.join(electronDir, 'path.txt');
const distDir = path.join(electronDir, 'dist');
const electronExe = path.join(distDir, 'electron.exe');

function isInstalled() {
  if (!fs.existsSync(pathFile)) return false;
  if (process.platform === 'win32' && !fs.existsSync(electronExe)) return false;
  return true;
}

function getMirrorUrl() {
  const npmrcPath = path.join(__dirname, '..', '.npmrc');
  let mirror = 'https://registry.npmmirror.com/-/binary/electron/';
  try {
    const npmrc = fs.readFileSync(npmrcPath, 'utf-8');
    const match = npmrc.match(/electron_mirror\s*=\s*(\S+)/);
    if (match) mirror = match[1];
  } catch {}
  if (process.env.ELECTRON_MIRROR) mirror = process.env.ELECTRON_MIRROR;
  return mirror.replace(/\/?$/, '/');
}

function clearCache() {
  let cacheDir;
  if (process.platform === 'win32') {
    cacheDir = path.join(process.env.LOCALAPPDATA || '', 'electron', 'Cache');
  } else if (process.platform === 'darwin') {
    cacheDir = path.join(process.env.HOME || '', 'Library', 'Caches', 'electron');
  } else {
    cacheDir = path.join(process.env.HOME || '', '.cache', 'electron');
  }
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    } catch {}
  }
}

function getPlatformPath() {
  switch (process.platform) {
    case 'darwin': return 'Electron.app/Contents/MacOS/Electron';
    case 'win32': return 'electron.exe';
    default: return 'electron';
  }
}

function main() {
  if (isInstalled()) {
    return;
  }

  console.log('[install-electron] Electron binary not found, downloading...');

  const pkgPath = path.join(electronDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('[install-electron] node_modules/electron/package.json not found');
    process.exit(1);
  }

  const version = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version;
  const mirror = getMirrorUrl();
  const platform = process.platform === 'win32' ? 'win32' : process.platform;
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const fileName = `electron-v${version}-${platform}-${arch}.zip`;
  const downloadUrl = `v${version}/${fileName}`;
  const fullUrl = mirror + downloadUrl;
  const zipPath = path.join(__dirname, '..', fileName);

  console.log(`[install-electron] Version: ${version}`);
  console.log(`[install-electron] URL: ${fullUrl}`);

  clearCache();

  try {
    fs.mkdirSync(distDir, { recursive: true });
    execSync(
      `curl -L --retry 3 --retry-delay 5 -o "${zipPath}" "${fullUrl}"`,
      { stdio: 'inherit', timeout: 300000 }
    );
  } catch (err) {
    console.error('[install-electron] Download failed:', err.message);
    try { fs.unlinkSync(zipPath); } catch {}
    process.exit(1);
  }

  if (!fs.existsSync(zipPath)) {
    console.error('[install-electron] Downloaded file not found');
    process.exit(1);
  }

  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${distDir}' -Force"`,
        { stdio: 'inherit', timeout: 120000 }
      );
    } else {
      execSync(
        `unzip -o "${zipPath}" -d "${distDir}"`,
        { stdio: 'inherit', timeout: 120000 }
      );
    }
  } catch (err) {
    console.error('[install-electron] Extract failed:', err.message);
    process.exit(1);
  } finally {
    try { fs.unlinkSync(zipPath); } catch {}
  }

  const platformPath = getPlatformPath();
  fs.writeFileSync(pathFile, platformPath);
  console.log(`[install-electron] Installed successfully: ${platformPath}`);
}

main();
