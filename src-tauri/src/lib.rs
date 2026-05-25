use tauri::{Manager, menu::{Menu, MenuItem}, tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent}};
use sysinfo::{System, Networks};
use serde::Serialize;

#[cfg(target_os = "windows")]
use windows_sys::Win32::Foundation::{HWND, LPARAM, BOOL, TRUE, FALSE};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    SetWindowPos, HWND_BOTTOM, SWP_SHOWWINDOW, SWP_NOACTIVATE, SWP_NOSIZE, SWP_NOMOVE,
    GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, WS_EX_TOOLWINDOW,
    FindWindowW, SendMessageTimeoutW, EnumWindows, SMTO_NORMAL, SetParent, FindWindowExW
};
#[cfg(target_os = "windows")]
use std::ptr;

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
    
    let cpu_usage = sys.global_cpu_info().cpu_usage();
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
            name: p.name().to_string(),
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

#[tauri::command]
fn set_widget_position(window: tauri::Window, x: i32, y: i32) {
    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
}


#[cfg(target_os = "windows")]
static mut WORKERW: HWND = 0;

#[cfg(target_os = "windows")]
unsafe extern "system" fn enum_windows_proc(hwnd: HWND, _lparam: LPARAM) -> BOOL {
    let p = FindWindowExW(hwnd, 0, windows_sys::core::w!("SHELLDLL_DefView"), ptr::null());
    if p != 0 {
        WORKERW = FindWindowExW(0, hwnd, windows_sys::core::w!("WorkerW"), ptr::null());
    }
    TRUE
}

// Aggressive function to force window to bottom desktop
#[cfg(target_os = "windows")]
pub fn force_bottom(hwnd: HWND) {
    unsafe {
        // We make it a tool window so it won't show up in Alt-Tab
        let mut ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
        ex_style |= WS_EX_TOOLWINDOW as i32;
        SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style);

        let progman = FindWindowW(windows_sys::core::w!("Progman"), ptr::null());
        SendMessageTimeoutW(progman, 0x052C, 0, 0, SMTO_NORMAL, 1000, ptr::null_mut());
        EnumWindows(Some(enum_windows_proc), 0);
        if WORKERW != 0 {
            SetParent(hwnd, WORKERW);
        } else {
             SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, 0, 0, SWP_SHOWWINDOW | SWP_NOACTIVATE | SWP_NOSIZE | SWP_NOMOVE);
        }
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
                // Only on windows for HWND
                #[cfg(target_os = "windows")]
                if let Ok(h_data) = window.hwnd() {
                    let hwnd_ptr = h_data.0 as isize;
                    force_bottom(hwnd_ptr as HWND);
                }

                #[cfg(not(target_os = "windows"))]
                let _ = window.set_always_on_bottom(true);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_system_stats, set_clickthrough, set_widget_position])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
