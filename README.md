<div align="center">

<img src="docs/logo.png" alt="Petravox" width="80" height="80" />

# Petravox

**Serveur Minecraft moddé — Fantasy vs. Science · Forge 1.20.1**

[![Minecraft](https://img.shields.io/badge/Minecraft-1.20.1-62b47a?style=flat-square&logo=minecraft&logoColor=white)](https://minecraft.net)
[![Forge](https://img.shields.io/badge/Forge-47.4.10-e04a00?style=flat-square)](https://files.minecraftforge.net)
[![Launcher](https://img.shields.io/badge/Launcher-v2.8.3-7c3aed?style=flat-square)](https://github.com/Leimmingz/Petravox-modpack/releases)
[![Site](https://img.shields.io/badge/Site-leimmingz.github.io-9f5cf7?style=flat-square)](https://leimmingz.github.io/Petravox-modpack/)
[![License](https://img.shields.io/badge/Licence-Privé-374151?style=flat-square)](#)

*Serveur privé sur invitation · Hébergé sur UniHeberg (France)*

🌐 **[Site web](https://leimmingz.github.io/Petravox-modpack/)** &nbsp;·&nbsp; 📥 **[Télécharger le launcher](https://github.com/Leimmingz/Petravox-modpack/releases/latest/download/Petravox.Launcher.exe)**

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

1. Télécharge le launcher ci-dessus
2. Connecte ton compte Microsoft
3. Clique sur **Jouer** — le launcher installe tout automatiquement
4. Adresse du serveur : `srv01.uniheberg.fr:25540`

---

## Changelog

### v2.8.3 — 13 juillet 2026 ← actuelle
- Fix auto-updater : `start /D` dans le bat pour garantir le bon répertoire au relancement (fix erreur DLL _tkinter après mise à jour)

### v2.8.2 — 13 juillet 2026
- Fix : carrousel Nouveautés toujours affiché, même si la version courante n'a que des entrées "fix/audit"
- Fix : roadmap n'affiche plus "Launcher v2.7" (supprimé du défaut codé en dur)

### v2.8.1 — 13 juillet 2026
- Audit auto-updater : comparaison de version avec `_ver_tuple()` (évite les faux positifs)
- Audit auto-updater : garde anti-double-clic, nettoyage du fichier partiel en cas d'erreur

### v2.8.0 — 13 juillet 2026
- Timer de session live dans la sidebar (s'affiche pendant le jeu, disparaît à la fermeture)
- Galerie de screenshots : onglet dédié avec miniatures cliquables (dossier `.petravox/minecraft/screenshots/`)
- Achievements dans le tableau de bord : 7 médailles basées sur sessions et heures jouées
- Notifications ami en ligne : toast quand le nombre de joueurs sur le serveur augmente

### v2.7.2 — 13 juillet 2026
- Fix auto-update : relancement depuis le bon répertoire (fix DLL python312)
- Fix carrousel : hauteur compacte, plus d'espace vide sous le texte

### v2.7.1 — 13 juillet 2026
- Fix auto-updater : bat avec répertoire de travail pour éviter l'erreur de chargement DLL

### v2.7.0 — 13 juillet 2026
- Tableau de bord : stats de jeu (sessions, temps total, dernière session), statut serveur live, infos modpack
- Thème clair optionnel (toggle dans Paramètres > Apparence, persisté entre sessions)
- Fix : dialogs de confirmation non-bloquants (déconnexion, réparation mods, suppression packs)
- Fix : config serveur lue depuis `launcher_config.json` (host, port dynamiques)
- Audit : durée 0 min affichée correctement dans l'historique

### v2.6.5 — 13 juillet 2026
- Fix : carrousel Nouveautés compact, hauteur fixe (plus d'espace vide sur grand écran)

### v2.6.4 — 13 juillet 2026
- Fix : roadmap affichée par défaut (valeurs codées en dur, plus de `roadmap.json` séparé)
- Fix : Ore Excavation dans les mods récents par défaut (au lieu de Ore Vein Miner)

### v2.6.3 — 13 juillet 2026
- Toast de bienvenue au démarrage (disparaît après 4s)
- Bandeau orange non-bloquant si le launcher n'est pas à jour
- Carte changelog dans la page Jouer quand une MAJ est disponible
- Suppression de la messagebox bloquante pour les mises à jour

### v2.6.2 — 13 juillet 2026
- Onglet Web : carte BlueMap + guide intégré, URLs dynamiques via config
- `launcher_config.json` étendu : annonce, liens, roadmap, carte live

### v2.6.1 — 13 juillet 2026
- Fix : tous les fichiers créés dans `.petravox` au lieu du dossier de l'exe
- `launcher_config.json` sur GitHub Pages : modifier carousel et mods récents sans recompiler

### v2.6.0 — 13 juillet 2026
- Onglet Ressources : gestionnaire de resource packs et shader packs (ajout/suppression de fichiers)
- Onglet Web : site Petravox intégré en direct dans le launcher (tkinterweb)

### v2.5.1 — 13 juillet 2026
- Skin Minecraft réel affiché dans la sidebar (face + chapeau)
- Clic sur avatar : menu compte (profil Xbox, déconnexion)
- Carrousel : glisser gauche/droite pour changer de slide

### v2.5.0 — 13 juillet 2026
- Onglet Serveur : statut en direct, joueurs connectés, copie IP en 1 clic
- Notifications toast (plus de popups bloquantes)
- Avatar coloré avec initiales dans la sidebar
- Compteur joueurs en direct dans la sidebar
- Historique des lancements dans À propos
- Bouton "Ouvrir le dossier .petravox" dans Paramètres
- Bouton "Réparer les mods" dans Paramètres
- Détection automatique du mode hors-ligne
- Sélecteur Java dans Paramètres

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
- Redesign complet de l