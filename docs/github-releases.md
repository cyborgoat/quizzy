# GitHub Releases

Quizzy uses `.github/workflows/release.yml` to build native installers on
GitHub-hosted macOS, Windows, and Linux machines.

## Produced artifacts

Each release builds:

- macOS Apple Silicon application and DMG
- macOS Intel application and DMG
- Windows x64 portable executable
- Windows x64 NSIS setup executable
- Windows x64 MSI installer
- Linux x64 AppImage
- Linux x64 DEB package

After every platform build succeeds, the workflow publishes the GitHub Release
and attaches each platform-specific download to its assets.

## Prepare a version

Set the same version in:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

The release workflow verifies these versions against the pushed tag and fails
before building if they differ.

For example, all three files should contain `0.1.0` before releasing tag
`v0.1.0`.

## Trigger a release

Commit and push the version:

```bash
git add package.json package-lock.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "Prepare v0.1.0 release"
git push origin main
```

Create and push the tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub runs the workflow automatically because the tag starts with `v`.

## Verify the release

1. Open the repository on GitHub.
2. Select **Actions** and wait for **Release Quizzy** to finish.
3. Select **Releases**.
4. Open `Quizzy v0.1.0`.
5. Confirm the macOS, Windows, and Linux assets are attached.

If a build fails, do not reuse the tag after changing code. Delete the failed
release and tag, or increment the application version and create a new tag.

## Permissions

The workflow uses GitHub's automatically provided `GITHUB_TOKEN` and requests
`contents: write` permission to create the release and upload assets. No custom
secret is required for unsigned builds.

Signed public releases require additional Apple and Windows signing credentials
stored as encrypted GitHub Actions secrets.
