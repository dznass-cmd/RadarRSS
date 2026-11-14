use std::net::TcpStream;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

static SERVER_CHILD: Mutex<Option<Child>> = Mutex::new(None);

fn which_node() -> String {
    if let Ok(out) = Command::new("which").arg("node").output() {
        if out.status.success() {
            let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !path.is_empty() {
                return path;
            }
        }
    }
    if std::path::Path::new("/home/dznas/.local/nodejs/bin/node").exists() {
        return "/home/dznas/.local/nodejs/bin/node".to_string();
    }
    "node".to_string()
}

fn ensure_server_running() {
    // Check if 127.0.0.1:3000 is already active
    if TcpStream::connect_timeout(
        &"127.0.0.1:3000".parse().unwrap(),
        Duration::from_millis(150),
    )
    .is_ok()
    {
        return;
    }

    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join("server.cjs"));
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        candidates.push(PathBuf::from(format!("{home}/.local/share/radar-rss/server.cjs")));
    }
    candidates.push(PathBuf::from("dist/server.cjs"));

    for path in candidates {
        if path.exists() {
            let node = which_node();
            let dist_dir = path.parent().unwrap_or(&path).join("dist");
            let dist_str = if dist_dir.exists() {
                dist_dir.to_string_lossy().to_string()
            } else {
                path.parent().unwrap_or(&path).to_string_lossy().to_string()
            };

            if let Ok(child) = Command::new(&node)
                .arg(&path)
                .env("PORT", "3000")
                .env("DIST_PATH", dist_str)
                .spawn()
            {
                if let Ok(mut lock) = SERVER_CHILD.lock() {
                    *lock = Some(child);
                }
                for _ in 0..20 {
                    if TcpStream::connect_timeout(
                        &"127.0.0.1:3000".parse().unwrap(),
                        Duration::from_millis(50),
                    )
                    .is_ok()
                    {
                        break;
                    }
                    std::thread::sleep(Duration::from_millis(50));
                }
                break;
            }
        }
    }
}

fn cleanup_server() {
    if let Ok(mut lock) = SERVER_CHILD.lock() {
        if let Some(mut child) = lock.take() {
            let _ = child.kill();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Ensure background Node/Express server is active for RSS & article extraction APIs
            ensure_server_running();

            // Create tray menu items
            let open_item = MenuItem::with_id(app, "open", "Abrir Radar RSS", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "Ocultar Janela", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Sair do Radar RSS", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&open_item, &hide_item, &quit_item])?;

            // Build Tray Icon
            let icon = app.default_window_icon().cloned().unwrap();
            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("Radar RSS - Leitor de Notícias IA")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        cleanup_server();
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Register Global Shortcut (Ctrl+Shift+R or Command+Shift+R)
            if let Ok(shortcut) = "Ctrl+Shift+R".parse::<Shortcut>() {
                let app_handle = app.handle().clone();
                let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Prevent app from quitting when user clicks [X], minimize to tray instead
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                cleanup_server();
            }
        });
}
