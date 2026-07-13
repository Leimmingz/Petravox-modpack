<div align="center">

<img src="docs/logo.png" alt="Petravox" width="80" height="80" />

# Petravox

**Serveur Minecraft moddé — Fantasy vs. Science · Forge 1.20.1**

[![Minecraft](https://img.shields.io/badge/Minecraft-1.20.1-62b47a?style=flat-square&logo=minecraft&logoColor=white)](https://minecraft.net)
[![Forge](https://img.shields.io/badge/Forge-47.4.10-e04a00?style=flat-square)](https://files.minecraftforge.net)
[![Launcher](https://img.shields.io/badge/Launcher-v2.4.4-7c3aed?style=flat-square)](https://github.com/Leimmingz/Petravox-modpack/releases)
[![License](https://img.shields.io/badge/Licence-Privé-374151?style=flat-square)](#)

*Serveur privé sur invitation · Hébergé sur UniHeberg (France)*

</div>

---

## À propos

Petravox est un serveur Minecraft moddé privé basé sur le modpack **Fantasy Vs. Science**, enrichi de plus de 205 mods. Il tourne sur Forge 1.20.1 et est accessible via un launcher dédié qui gère automatiquement l'installation et les mises à jour.

---

## Launcher

Le launcher Petravox est un exécutable Windows (.exe) qui s'occupe de tout :

- Connexion Microsoft (Device Flow OAuth, sans stocker ton mot de passe)
- Installation automatique de Forge 1.20.1-47.4.10
- Téléchargement et mise à jour des mods depuis ce repo
- Lancement de Minecraft avec les bons paramètres JVM
- Mises à jour automatiques du launcher lui-même

### Téléchargement

👉 **[Télécharger le launcher (dernière version)](https://github.com/Leimmingz/Petravox-modpack/releases/latest)**

Lance `Petravox.Launcher.exe` — aucune installation requise.

### Paramètres disponibles

| Paramètre | Description |
|-----------|-------------|
| RAM min / max | Adapté à ta machine, détection automatique |
| Résolution | HD / FHD / 2K ou valeur personnalisée |
| Plein écran | Activable, désactive la résolution fixe |
| Fermer au lancement | Ferme le launcher quand Minecraft démarre |

---

## Structure du repo

```
Petravox-modpack/
├── docs/
│   ├── index.html                  # Site principal (GitHub Pages)
│   ├── Petravox_Launcher.html      # Page téléchargement launcher
│   ├── logo.png                    # Logo Petravox
│   └── launcher/
│       └── version.json            # Version actuelle du launcher
└── README.md
```

---

## Modpack

Le modpack est distribué au format `.mrpack` (compatible Modrinth) via les [Releases GitHub](https://github.com/Leimmingz/Petravox-modpack/releases).

Le launcher le télécharge et l'installe automatiquement. En cas de mise à jour du modpack, il détecte le changement au prochain lancement et resynchronise les mods.

**Mods notables :** Easy NPC 7.0.0, Create, Waystones, Artifacts, Immersive Engineering [+ 200 autres]

---

## Rejoindre le serveur

Le serveur est en **whitelist** (sur invitation uniquement).

1. Télécharge le launcher ci-dessus
2. Connecte ton compte Microsoft
3. Clique sur **Jouer** — le launcher installe tout automatiquement
4. Adresse du serveur : `srv01.uniheberg.fr:25540`

---

## Publier une mise à jour du launcher

1. Modifier `LAUNCHER_VERSION` dans `petravox_launcher.py`
2. Ajouter les entrées dans `CHANGELOG` (dans le même fichier)
3. Compiler avec `compiler_en_exe.bat`
4. Uploader l'exe dans une nouvelle Release GitHub (nom : `Petravox.Launcher.exe`)
5. Mettre à jour `docs/launcher/version.json`
6. `git add . && git commit -m "launcher vX.Y.Z" && git push`

> **Versionnage :** fonctionnalité majeure → X.Y.0 · petite amélioration → X.Y.Z

---

## Changelog

### v2.4.4 — 13 juillet 2026
- Fenêtre toujours visible même si erreur au démarrage (try/finally)
- F11 corrigé : plus de rectangles blancs (state zoomed/normal)
- URL de mise à jour corrigée vers GitHub Releases
- Log d'erreurs dans `%appdata%\.petravox\launcher_error.log`

### v2.4.2 / v2.4.3 — 13 juillet 2026
- Animations boutons : flash lumineux au clic
- Transition fondu entre les slides du carrousel
- Sons de boutons (clic, navigation, succès lancement)
- Démarrage propre sans saut de taille

### v2.4.1 — 13 juillet 2026
- VFX : particules flottantes animées en arrière-plan
- Pulsation couleur du bouton JOUER
- Bouton JOUER redimensionné (plus compact)

### v2.4.0 — 13 juillet 2026
- Launcher en plein écran au démarrage (F11 pour basculer)
- Carrousel Nouveautés sur la page Jouer
- Boutons Site web et GitHub dans la sidebar et À propos

### v2.3.0 — 13 juillet 2026
- Plein écran Minecraft configurable dans les paramètres
- Auto-updater : le launcher se met à jour tout seul
- RAM dynamique : sliders adaptés à la RAM du PC
- Avertissement si RAM < 4 Go
- Barre de progression réaliste
- Changelog intégré dans le launcher

### v2.2.0 — 13 juillet 2026
- Redesign complet de l'interface (sidebar, thème violet foncé)
- Logo Petravox, "Powered by Zervox"
- Paramètres persistants, résolution, toggle fermeture
- Terminal caché au lancement de Minecraft

### v1.x — Avant juillet 2026
- Launcher initial avec auth Microsoft Device Flow
- Correction NullPointerException serveur (Easy NPC 5.9.2 → 7.0.0)
- Mise à jour Forge 47.4.9 → 47.4.10

---

<div align="center">
  <sub>Powered by <strong>Zervox</strong> · Serveur privé · Non affilié à Mojang</sub>
</div>
