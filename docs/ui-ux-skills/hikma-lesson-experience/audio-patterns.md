# Patterns audio

Utiliser `AudioPlayer` et son coordinateur existant. Un bouton indique son libellé, son état de chargement, sa lecture et son erreur. Ne jamais fabriquer une URL, une waveform ou un résultat audio. Quand la source manque, afficher une information neutre et proposer l’action suivante disponible.

Dans le focus mode, l’audio est associé directement au mot ou à la compétence courante : `Écouter le modèle` pour la prononciation guidée, puis l’action locale de répétition. Une indisponibilité se formule sans bouton cassé : « Audio momentanément indisponible. Tu peux continuer. »

La scène de découverte évite de présenter deux fois le même modèle audio : si la
prononciation guidée est active pour le premier mot, son lecteur porte l’écoute
du modèle ; sinon le mot courant utilise le lecteur compact `Écouter le mot`.
Les états visuels restent ceux d’`AudioPlayer` : idle, loading, playing, paused,
ended et error. Aucun état audio ne doit suggérer une analyse automatique de la
prononciation.
