// todoary - Tauri main entry
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
mod legacy_macos;

#[cfg(not(debug_assertions))]
use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            export_backup_file,
            youtube_player_mode,
            youtube_player_set_bounds,
            youtube_player_play,
            youtube_player_pause,
            youtube_player_resume,
            youtube_player_stop,
            youtube_player_set_volume
        ])
        .setup(|app| {
            #[cfg(all(target_os = "macos", not(debug_assertions)))]
            legacy_macos::remove_legacy_vibe_diary_app_once(app.handle());

            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = check_update(handle).await {
                        eprintln!("update check failed: {e}");
                    }
                });
            }

            #[cfg(target_os = "macos")]
            {
                use tauri::menu::{Menu, MenuItem, SubmenuBuilder, PredefinedMenuItem};
                use tauri::Emitter;

                let handle = app.handle();
                let menu = Menu::new(handle).unwrap();

                // 1. App Submenu (todoary)
                let app_menu = SubmenuBuilder::new(handle, "todoary")
                    .item(&PredefinedMenuItem::about(handle, Some("todoary"), None).unwrap())
                    .separator()
                    .item(&PredefinedMenuItem::hide(handle, None).unwrap())
                    .item(&PredefinedMenuItem::hide_others(handle, None).unwrap())
                    .item(&PredefinedMenuItem::show_all(handle, None).unwrap())
                    .separator()
                    .item(&PredefinedMenuItem::quit(handle, None).unwrap())
                    .build()
                    .unwrap();

                // 2. Edit Submenu (Copy & Paste 등 단축키 제공)
                let edit_menu = SubmenuBuilder::new(handle, "Edit")
                    .item(&PredefinedMenuItem::undo(handle, None).unwrap())
                    .item(&PredefinedMenuItem::redo(handle, None).unwrap())
                    .separator()
                    .item(&PredefinedMenuItem::cut(handle, None).unwrap())
                    .item(&PredefinedMenuItem::copy(handle, None).unwrap())
                    .item(&PredefinedMenuItem::paste(handle, None).unwrap())
                    .item(&PredefinedMenuItem::select_all(handle, None).unwrap())
                    .build()
                    .unwrap();

                // 3. Todoary Custom Submenu (Cmd+M 단축키 매핑)
                let toggle_dock = MenuItem::with_id(
                    handle,
                    "toggle_dock",
                    "Toggle Dock Minimization",
                    true,
                    Some("CmdOrCtrl+M"),
                ).unwrap();

                let custom_submenu = SubmenuBuilder::new(handle, "Todoary")
                    .item(&toggle_dock)
                    .build()
                    .unwrap();

                // 메뉴바 조립
                let _ = menu.append(&app_menu);
                let _ = menu.append(&edit_menu);
                let _ = menu.append(&custom_submenu);

                let _ = app.set_menu(menu);

                app.on_menu_event(move |app_handle, event| {
                    if event.id == "toggle_dock" {
                        let _ = app_handle.emit("toggle-dock-hidden", ());
                    }
                });
            }

            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn export_backup_file(
    app: tauri::AppHandle,
    file_name: String,
    contents: String,
) -> Result<bool, String> {
    use tauri_plugin_dialog::DialogExt;

    let Some(file_path) = app
        .dialog()
        .file()
        .set_title("백업 저장")
        .set_file_name(file_name)
        .add_filter("JSON", &["json"])
        .blocking_save_file()
    else {
        return Ok(false);
    };

    let mut path = file_path.into_path().map_err(|e| e.to_string())?;
    if path.extension().is_none() {
        path.set_extension("json");
    }

    std::fs::write(path, contents).map_err(|e| e.to_string())?;
    Ok(true)
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

#[tauri::command]
fn youtube_player_set_bounds(
    app: tauri::AppHandle,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    visible: bool,
) -> Result<(), String> {
    native_youtube::set_bounds(app, x, y, width, height, visible)
}

#[tauri::command]
fn youtube_player_set_volume(app: tauri::AppHandle, volume: f64) -> Result<(), String> {
    native_youtube::set_volume(app, volume)
}

#[cfg(not(debug_assertions))]
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
    use tauri::{LogicalPosition, LogicalSize, Manager, Webview, WebviewBuilder, WebviewUrl};

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
        let webview = get_or_create_webview(&app)?;

        let _ = webview.show();
        let res = load_with_referer(&webview, embed_url, REFERRER.to_string());
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_focus();
        }
        res
    }

    pub fn pause(app: tauri::AppHandle) -> Result<(), String> {
        let res = eval_player(
            &app,
            r#"(function(){var v=document.querySelector("video");if(v){v.pause();}})()"#,
        );
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_focus();
        }
        res
    }

    pub fn resume(app: tauri::AppHandle) -> Result<(), String> {
        let res = eval_player(
            &app,
            r#"(function(){var v=document.querySelector("video");if(v){var p=v.play();if(p&&p.catch)p.catch(function(){});}})()"#,
        );
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_focus();
        }
        res
    }

    pub fn set_volume(app: tauri::AppHandle, volume: f64) -> Result<(), String> {
        let vol = volume.clamp(0.0, 1.0);
        let muted = if vol <= 0.0 { "true" } else { "false" };
        eval_player(
            &app,
            &format!(
                r#"(function(){{
                    var targetVol = {vol};
                    var targetMuted = {muted};
                    var apply = function() {{
                        var v = document.querySelector("video");
                        if (v) {{
                            v._targetVol = targetVol;
                            v._targetMuted = targetMuted;
                            if (v.volume !== targetVol || v.muted !== targetMuted) {{
                                v.muted = targetMuted;
                                v.volume = targetVol;
                            }}
                            if (!v._volBound) {{
                                v._volBound = true;
                                v.addEventListener("volumechange", function() {{
                                    var curTargetVol = v._targetVol !== undefined ? v._targetVol : targetVol;
                                    var curTargetMuted = v._targetMuted !== undefined ? v._targetMuted : targetMuted;
                                    if (v.volume !== curTargetVol || v.muted !== curTargetMuted) {{
                                        v.muted = curTargetMuted;
                                        v.volume = curTargetVol;
                                    }}
                                }});
                            }}
                            return true;
                        }}
                        return false;
                    }};
                    if (!apply()) {{
                        var observer = new MutationObserver(function() {{
                            if (apply()) {{
                                observer.disconnect();
                            }}
                        }});
                        observer.observe(document.body || document.documentElement, {{ childList: true, subtree: true }});
                        setTimeout(apply, 2000);
                    }}
                }})()"#
            ),
        )
    }

    pub fn stop(app: tauri::AppHandle) -> Result<(), String> {
        if let Some(webview) = app.get_webview(LABEL) {
            webview.close().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn set_bounds(
        app: tauri::AppHandle,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        visible: bool,
    ) -> Result<(), String> {
        let webview = get_or_create_webview(&app)?;
        webview
            .set_position(LogicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;
        webview
            .set_size(LogicalSize::new(width, height))
            .map_err(|e| e.to_string())?;
        if visible {
            webview.show().map_err(|e| e.to_string())?;
        } else {
            webview.hide().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    fn get_or_create_webview(app: &tauri::AppHandle) -> Result<Webview, String> {
        if let Some(webview) = app.get_webview(LABEL) {
            return Ok(webview);
        }

        let main = app
            .get_webview_window("main")
            .ok_or_else(|| "main webview window not found".to_string())?;
        let parent = main.as_ref().window();

        let url = "about:blank"
            .parse()
            .map_err(|e: url::ParseError| e.to_string())?;
        let builder = WebviewBuilder::new(LABEL, WebviewUrl::External(url));

        let webview = parent
            .add_child(
                builder,
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(356.0, 200.0),
            )
            .map_err(|e| e.to_string())?;
        let _ = webview.hide();
        Ok(webview)
    }

    fn load_with_referer(
        webview: &Webview,
        embed_url: String,
        referer: String,
    ) -> Result<(), String> {
        webview
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
        let webview = app
            .get_webview(LABEL)
            .ok_or_else(|| "youtube player is not open".to_string())?;
        webview.eval(js).map_err(|e| e.to_string())
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
    pub fn set_bounds(
        _app: tauri::AppHandle,
        _x: f64,
        _y: f64,
        _width: f64,
        _height: f64,
        _visible: bool,
    ) -> Result<(), String> {
        Ok(())
    }

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

    pub fn set_volume(_app: tauri::AppHandle, _volume: f64) -> Result<(), String> {
        Ok(())
    }
}
