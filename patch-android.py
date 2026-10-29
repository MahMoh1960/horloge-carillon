#!/usr/bin/env python3
"""Adapte le projet Android généré par Capacitor pour l'Horloge carillon.

  1. Plugin de notifications : une notification dont « extra.fullScreen » vaut vrai est publiée
     avec une intention plein écran (comme un réveil) : l'écran s'allume et l'application
     s'affiche par-dessus l'écran verrouillé.
  2. Manifeste : permissions (alarmes exactes, notifications, plein écran...) et attributs
     showWhenLocked / turnScreenOn de l'activité principale.

Usage : python3 patch-android.py [racine_du_projet]
Le script s'arrête avec une erreur claire si un repère attendu est introuvable."""
import os
import sys

root = sys.argv[1] if len(sys.argv) > 1 else '.'

# ---------- 1. Plugin LocalNotifications : intention plein écran ----------
plugin = os.path.join(root, 'node_modules', '@capacitor', 'local-notifications', 'android', 'src', 'main', 'java',
                      'com', 'capacitorjs', 'plugins', 'localnotifications', 'LocalNotificationManager.java')
src = open(plugin, encoding='utf-8').read()
if 'fullScreenExtra' not in src:
    anchor = '        createActionIntents(localNotification, mBuilder);\n'
    if src.count(anchor) != 1:
        sys.exit("ERREUR : repère introuvable dans LocalNotificationManager.java "
                 "(version du plugin inattendue : utilisez @capacitor/local-notifications 6.1.3)")
    block = '''        // Horloge carillon : écran allumé et application affichée par-dessus l'écran verrouillé
        JSObject fullScreenExtra = localNotification.getExtra();
        if (fullScreenExtra != null && fullScreenExtra.optBoolean("fullScreen", false)) {
            Intent fullScreenIntent = buildIntent(localNotification, DEFAULT_PRESS_ACTION);
            int fullScreenFlags = PendingIntent.FLAG_CANCEL_CURRENT;
            if (android.os.Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                fullScreenFlags = fullScreenFlags | PendingIntent.FLAG_MUTABLE;
            }
            PendingIntent fullScreenPending = PendingIntent.getActivity(
                context,
                -(localNotification.getId() + 1),
                fullScreenIntent,
                fullScreenFlags
            );
            mBuilder.setFullScreenIntent(fullScreenPending, true);
            mBuilder.setPriority(NotificationCompat.PRIORITY_HIGH);
        }
'''
    src = src.replace(anchor, anchor + block, 1)
    open(plugin, 'w', encoding='utf-8').write(src)
    print('plugin : notification plein écran ajoutée')
else:
    print('plugin : déjà modifié')

# ---------- 2. Manifeste Android ----------
manifest = os.path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')
mx = open(manifest, encoding='utf-8').read()
perms = ['SCHEDULE_EXACT_ALARM', 'USE_EXACT_ALARM', 'POST_NOTIFICATIONS', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED',
         'WAKE_LOCK', 'USE_FULL_SCREEN_INTENT']
add = ''.join('    <uses-permission android:name="android.permission.%s" />\n' % p
              for p in perms if 'android.permission.%s"' % p not in mx)
if add:
    if '<application' not in mx:
        sys.exit("ERREUR : balise <application> introuvable dans AndroidManifest.xml")
    mx = mx.replace('<application', add.lstrip() + '    <application', 1)
if 'showWhenLocked' not in mx:
    if mx.count('<activity') < 1:
        sys.exit("ERREUR : balise <activity> introuvable dans AndroidManifest.xml")
    mx = mx.replace('<activity', '<activity\n            android:showWhenLocked="true"\n            android:turnScreenOn="true"', 1)
open(manifest, 'w', encoding='utf-8').write(mx)
print('manifeste : permissions et attributs d\'écran verrouillé en place')
