use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Open Dashboard", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit ZPortGuard", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &separator, &quit])?;


    #[cfg(target_os = "windows")]
    let icon = Image::from_bytes(include_bytes!("../icons/icon.ico")).unwrap();

    #[cfg(not(target_os = "windows"))]
    let icon = app
        .default_window_icon()
        .cloned()
        .unwrap_or_else(|| Image::from_bytes(include_bytes!("../icons/32x32.png")).unwrap());

    #[allow(unused_mut)]
    let mut builder = TrayIconBuilder::with_id("main")
        .icon(icon)
        .menu(&menu)


        .show_menu_on_left_click(false)
        .tooltip("ZPortGuard — All Clear")
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_tray_window(tray.app_handle());
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "show" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.unminimize();
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            _ => {}
        });


    #[cfg(target_os = "macos")]
    {
        builder = builder.icon_as_template(true);
    }

    builder.build(app)?;

    Ok(())
}

fn toggle_tray_window(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("tray") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}

pub fn update_tray_tooltip(app: &AppHandle, has_conflict: bool, conflict_count: usize) {
    if let Some(tray) = app.tray_by_id("main") {
        let tooltip = if has_conflict {
            format!("ZPortGuard — {} conflict(s) detected", conflict_count)
        } else {
            "ZPortGuard — All Clear".into()
        };
        let _ = tray.set_tooltip(Some(&tooltip));
    }
}
