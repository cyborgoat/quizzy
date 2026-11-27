use std::{
    env, fs,
    path::{Path, PathBuf},
};

fn main() {
    let url = resolve_default_base_url();
    println!("cargo:rustc-env=QUIZHUB_DEFAULT_BASE_URL={url}");
    println!("cargo:rerun-if-env-changed=QUIZHUB_DEFAULT_BASE_URL");
    if let Some(dotenv) = dotenv_path() {
        println!("cargo:rerun-if-changed={}", dotenv.display());
    }
    tauri_build::build();
}

fn resolve_default_base_url() -> String {
    if let Some(url) = env_value("QUIZHUB_DEFAULT_BASE_URL") {
        return ensure_trailing_slash(url);
    }
    if let Some(url) = read_dotenv_value("QUIZHUB_DEFAULT_BASE_URL") {
        return ensure_trailing_slash(url);
    }

    let profile = env::var("PROFILE").unwrap_or_default();
    if profile == "release" {
        panic!(
            "QUIZHUB_DEFAULT_BASE_URL must be set for release builds \
             (environment variable or repo-root .env)."
        );
    }

    // Dev/test fallback when the secret is not configured locally.
    "http://127.0.0.1:9/".to_string()
}

fn env_value(key: &str) -> Option<String> {
    env::var(key).ok().and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn dotenv_path() -> Option<PathBuf> {
    let manifest_dir = env::var_os("CARGO_MANIFEST_DIR")?;
    let path = Path::new(&manifest_dir).join("../.env");
    path.exists().then_some(path)
}

fn read_dotenv_value(key: &str) -> Option<String> {
    let path = dotenv_path()?;
    let contents = fs::read_to_string(path).ok()?;
    for line in contents.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let Some((raw_key, raw_value)) = line.split_once('=') else {
            continue;
        };
        if raw_key.trim() != key {
            continue;
        }
        let value = raw_value
            .trim()
            .trim_matches('"')
            .trim_matches('\'')
            .trim();
        if !value.is_empty() {
            return Some(value.to_string());
        }
    }
    None
}

fn ensure_trailing_slash(url: String) -> String {
    if url.ends_with('/') {
        url
    } else {
        format!("{url}/")
    }
}
