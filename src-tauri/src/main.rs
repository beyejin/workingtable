#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            youtube_player_mode,
            youtube_player_play,
            youtube_player_pause,
            youtube_player_resume,
            youtube_player_stop
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = check_update(handle).await {
                    eprintln!("update check failed: {e}");
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn youtube_player_mode() -> &'static str {
    #[cfg(target_os = "macos")]
    {
        "native-macos"
    }
    #[cfg(not(target_os = "macos"))]
    {
        "web"
    }
}

#[tauri::command]
fn youtube_player_play(
    app: tauri::AppHandle,
    video_id: String,
    playlist: Vec<String>,
) -> Result<(), String> {
    native_youtube::play(app, video_id, playlist)
}

#[tauri::command]
fn youtube_player_pause(app: tauri::AppHandle) -> Result<(), String> {
    native_youtube::pause(app)
}

#[tauri::command]
fn youtube_player_resume(app: tauri::AppHandle) -> Result<(), String> {
    native_youtube::resume(app)
}

#[tauri::command]
fn youtube_player_stop(app: tauri::AppHandle) -> Result<(), String> {
    native_youtube::stop(app)
}

async fn check_update(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let updater = app.updater()?;
    if let Some(update) = updater.check().await? {
        update
            .download_and_install(|_chunk, _total| {}, || {})
            .await?;
        app.restart();
    }
    Ok(())
}

#[cfg(target_os = "macos")]
mod native_youtube {
    use objc2_foundation::{NSMutableURLRequest, NSURL, NSString};
    use objc2_web_kit::WKWebView;
    use tauri::{Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

    const LABEL: &str = "youtube-player";
    const REFERRER: &str = "https://app.vibe-diary";

    pub fn play(
        app: tauri::AppHandle,
        video_id: String,
        playlist: Vec<String>,
    ) -> Result<(), String> {
        validate_video_id(&video_id)?;
        let playlist = playlist
            .into_iter()
            .filter(|id| validate_video_id(id).is_ok())
            .collect::<Vec<_>>();
        let embed_url = embed_url(&video_id, &playlist);
        let window = get_or_create_window(&app)?;

        window.show().map_err(|e| e.to_string())?;
        let _ = window.set_focus();
        load_with_referer(&window, embed_url, REFERRER.to_string())
    }

    pub fn pause(app: tauri::AppHandle) -> Result<(), String> {
        eval_player(
            &app,
            r#"(function(){var v=document.querySelector("video");if(v)v.pause();})()"#,
        )
    }

    pub fn resume(app: tauri::AppHandle) -> Result<(), String> {
        eval_player(
            &app,
            r#"(function(){var v=document.querySelector("video");if(v){v.muted=false;v.volume=1;var p=v.play();if(p&&p.catch)p.catch(function(){});}})()"#,
        )
    }

    pub fn stop(app: tauri::AppHandle) -> Result<(), String> {
        if let Some(window) = app.get_webview_window(LABEL) {
            window.close().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    fn get_or_create_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
        if let Some(window) = app.get_webview_window(LABEL) {
            return Ok(window);
        }

        let url = "about:blank"
            .parse()
            .map_err(|e: url::ParseError| e.to_string())?;

        WebviewWindowBuilder::new(app, LABEL, WebviewUrl::External(url))
            .title("vibe diary music")
            .inner_size(480.0, 270.0)
            .min_inner_size(356.0, 200.0)
            .resizable(true)
            .decorations(true)
            .skip_taskbar(true)
            .visible(false)
            .build()
            .map_err(|e| e.to_string())
    }

    fn load_with_referer(
        window: &WebviewWindow,
        embed_url: String,
        referer: String,
    ) -> Result<(), String> {
        window
            .with_webview(move |webview| unsafe {
                let view: &WKWebView = &*webview.inner().cast();
                let Some(url) = NSURL::URLWithString(&NSString::from_str(&embed_url)) else {
                    return;
                };
                let request = NSMutableURLRequest::requestWithURL(&url);
                request.addValue_forHTTPHeaderField(
                    &NSString::from_str(&referer),
                    &NSString::from_str("Referer"),
                );
                view.loadRequest(&request);
            })
            .map_err(|e| e.to_string())
    }

    fn eval_player(app: &tauri::AppHandle, js: &str) -> Result<(), String> {
        let window = app
            .get_webview_window(LABEL)
            .ok_or_else(|| "youtube player is not open".to_string())?;
        window.eval(js).map_err(|e| e.to_string())
    }

    fn embed_url(video_id: &str, playlist: &[String]) -> String {
        let mut url = format!(
            "https://www.youtube.com/embed/{video_id}?autoplay=1&playsinline=1&controls=1&rel=0&iv_load_policy=3&enablejsapi=1&origin={REFERRER}&widget_referrer={REFERRER}"
        );
        if !playlist.is_empty() {
            url.push_str("&playlist=");
            url.push_str(&playlist.join(","));
        }
        url
    }

    fn validate_video_id(video_id: &str) -> Result<(), String> {
        let valid = video_id.len() == 11
            && video_id
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-');
        if valid {
            Ok(())
        } else {
            Err("invalid YouTube video id".to_string())
        }
    }
}

#[cfg(not(target_os = "macos"))]
mod native_youtube {
    pub fn play(
        _app: tauri::AppHandle,
        _video_id: String,
        _playlist: Vec<String>,
    ) -> Result<(), String> {
        Err("native YouTube player is only available on macOS".to_string())
    }

    pub fn pause(_app: tauri::AppHandle) -> Result<(), String> {
        Err("native YouTube player is only available on macOS".to_string())
    }

    pub fn resume(_app: tauri::AppHandle) -> Result<(), String> {
        Err("native YouTube player is only available on macOS".to_string())
    }

    pub fn stop(_app: tauri::AppHandle) -> Result<(), String> {
        Ok(())
    }
}
