// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

/// Renvoie la plateforme sur laquelle l'application s'exécute
/// Cette fonction peut être appelée depuis JavaScript via invoke
#[tauri::command]
fn get_platform() -> String {
    #[cfg(target_os = "macos")]
    return "macOS".to_string();
    #[cfg(target_os = "ios")]
    return "iOS".to_string();
    #[cfg(target_os = "android")]
    return "Android".to_string();
    #[cfg(target_os = "windows")]
    return "Windows".to_string();
    #[cfg(target_os = "linux")]
    return "Linux".to_string();
    "Unknown".to_string()
}

/// Vérifie si l'application s'exécute dans Tauri
/// Cette fonction peut être appelée depuis JavaScript via invoke
#[tauri::command]
fn is_tauri() -> bool {
    true
}

fn main() {
  tauri::Builder::default()
    // Enregistrer le plugin HTTP pour permettre les requêtes réseau
    .plugin(tauri_plugin_http::init())
    // Ajouter le plugin CORS-Fetch pour résoudre les problèmes CORS
    .plugin(tauri_plugin_cors_fetch::init())
    // Enregistrer les fonctions qui peuvent être appelées depuis JavaScript
    .invoke_handler(tauri::generate_handler![get_platform, is_tauri])
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        if let Some(window) = app.get_webview_window("main") {
          window.open_devtools();
          println!("DevTools ouverts pour le débogage");
        } else {
          println!("Fenêtre principale non trouvée");
        }
      }
      
      // Afficher la plateforme au démarrage
      println!("Application Tauri démarrée sur {}", get_platform());
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
