use tauri::{Manager, menu::{Menu, MenuItem}, tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent}};
use windows_sys::Win32::Foundation::{HWND};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    SetWindowPos, HWND_BOTTOM, SWP_SHOWWINDOW, SWP_NOACTIVATE, SWP_NOSIZE, SWP_NOMOVE
};
use sysinfo::{System, Networks};
use serde::Serialize;
use std::thread;
use std::time::Duration;

#[derive(Serialize)]
pub struct ProcessInfo {
    name: String,
    cpu_usage: f32,
    memory: u64,
}

#[derive(Serialize)]
pub struct SystemStats {
    cpu_usage: f32,
    memory_used: u64,
    memory_total: u64,
    net_down: f64,
    net_up: f64,
    top_processes: Vec<ProcessInfo>,
}

#[tauri::command]
fn get_system_stats() -> SystemStats {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let cpu_usage = sys.global_cpu_usage();
    let memory_used = sys.used_memory();
    let memory_total = sys.total_memory();
    
    let mut net_down = 0.0;
    let mut net_up = 0.0;
    
    let networks = Networks::new_with_refreshed_list();
    for (_interface_name, data) in &networks {
        net_down += data.received() as f64;
        net_up += data.transmitted() as f64;
    }

    let mut processes: Vec<ProcessInfo> = sys.processes()
        .values()
        .map(|p| ProcessInfo {
            name: p.name().to_string_lossy().to_string(),
            cpu_usage: p.cpu_usage(),
            memory: p.memory(),
        })
        .collect();
    
    processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
    processes.truncate(5);
    
    SystemStats {
        cpu_usage,
        memory_used,
        memory_total,
        net_down: net_down / 1024.0 / 1024.0, // MB/s
        net_up: net_up / 1024.0 / 1024.0,     // MB/s
        top_processes: processes,
    }
}

#[tauri::command]
fn set_clickthrough(window: tauri::Window, ignore: bool) {
    let _ = window.set_ignore_cursor_events(ignore);
}

// Aggressive function to force window to bottom
pub fn force_bottom(hwnd: HWND) {
    unsafe {
        SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, 0, 0, SWP_SHOWWINDOW | SWP_NOACTIVATE | SWP_NOSIZE | SWP_NOMOVE);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec![])))
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit Command Center", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show/Hide Widget", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(true) {
                                window.hide().unwrap();
                            } else {
                                window.show().unwrap();
                            }
                        }
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
                            if window.is_visible().unwrap_or(true) {
                                window.hide().unwrap();
                            } else {
                                window.show().unwrap();
                            }
                        }
                    }
                });

            let _tray = if let Some(icon) = app.default_window_icon() {
                tray_builder.icon(icon.clone()).build(app)?
            } else {
                tray_builder.build(app)?
            };

            if let Some(window) = app.get_webview_window("main") {
                window.show().unwrap();
                let _ = window.set_ignore_cursor_events(true);
                
                // CAST TO ISIZE to send between threads safely
                if let Ok(h_data) = window.hwnd() {
                    let hwnd_ptr = h_data.0 as isize;
                    thread::spawn(move || {
                        loop {
                            force_bottom(hwnd_ptr as HWND);
                            thread::sleep(Duration::from_millis(500));
                        }
                    });
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_system_stats, set_clickthrough])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
