---
name: verif
description: Verify implementation by running lint, TypeScript diagnostics, and checking for errors
---

# Verification de l'implementation

Effectue les verifications suivantes dans l'ordre :

## 1. ESLint

Lance `pnpm lint --fix` pour corriger automatiquement les erreurs de formatage et de tri des imports, puis verifie qu'il n'y a plus d'erreurs. Sauf evidemment si il est passe juste avant.

Si des erreurs persistent apres le `--fix`, corrige-les manuellement.

## 2. Verification post-implementation

Fais une revue approfondie de l'implementation pour verifier que les changements sont conformes aux attentes, que les fonctionnalites sont bien implementees, et que le code est propre et maintenable. Tu peux utiliser le MCP `feature-dev:code-reviewer` (et d'autres si besoin) pour t'assister dans cette revue, en incluant un build de controle a la fin pour verifier que le projet compile correctement.

## 3. Issues mineures hors scope

Si la revue (etape 2) releve des issues mineures **hors du scope direct** de la session (bugs pre-existants, limitations techniques, ameliorations cosmetiques reperees dans le code voisin), utilise `AskUserQuestion` pour les presenter **interactivement** avec des propositions de correction :

Pour chaque issue trouvee :
- Affiche le fichier, la ligne, la description courte, la severite et **la correction proposee** (extrait de code avant/apres)
- Utilise `AskUserQuestion` avec des suggestions cliquables : `["Corrige tout", "Corrige seulement #1, #3", "Ignore tout"]` (adapte les numeros aux issues trouvees)
- Si l'utilisateur valide (tout ou partie), applique les corrections et relance lint + build
- Si l'utilisateur refuse, note-les dans le resume comme "non corrigees (hors scope)"

## 4. Resume

A la fin, affiche un resume clair :
- Nombre de fichiers verifies
- Erreurs ESLint trouvees et corrigees (ou aucune)
- Rapport de verification post-implementation
- Issues mineures hors scope proposees et leur statut (corrigees / refusees / aucune)
- Statut final : OK ou KO avec details
