// todoary — Tauri 메인 엔트리
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(not(debug_assertions))]
use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 시작 시 백그라운드로 업데이트 확인 (네트워크 없으면 조용히 무시)
            // dev 빌드에선 비활성화 — 개발 중 인스톨러가 뜨는 걸 막기 위함.
            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = check_update(handle).await {
                        eprintln!("업데이트 확인 실패: {e}");
                    }
                });
            }
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(not(debug_assertions))]
async fn check_update(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let updater = app.updater()?;
    if let Some(update) = updater.check().await? {
        // 새 버전이 있으면 다운로드 후 설치, 완료되면 앱 재시작
        update
            .download_and_install(|_chunk, _total| {}, || {})
            .await?;
        app.restart();
    }
    Ok(())
}
