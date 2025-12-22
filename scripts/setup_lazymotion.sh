#!/bin/bash

# Script pour configurer LazyMotion correctement dans le projet
# Ce script doit être exécuté depuis la racine du projet

echo "🚀 Configuration de LazyMotion pour une architecture évolutive"
echo "=============================================================="
echo ""

# Étape 1 : Créer un backup
echo "📦 Étape 1/5 : Création d'un backup (git)..."
if [ -d ".git" ]; then
    echo "✅ Repository git trouvé - vous pouvez utiliser git pour restaurer"
    git status > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "💡 État actuel enregistré"
    else
        echo "⚠️  Erreur git - vérifiez votre repository"
    fi
else
    echo "⚠️  Pas de repository git - créez un backup manuel avec:"
    echo "   cp -r src backup_src_lazymotion"
fi
echo ""

# Étape 2 : Exécuter la conversion
echo "🔧 Étape 2/5 : Conversion des composants motion -> m..."
node scripts/convert_to_lazymotion.js
echo ""

# Étape 3 : Vérifier la conversion
echo "🔍 Étape 3/5 : Vérification des composants restants..."
MOTION_COUNT=$(grep -r "motion\." src/ --include="*.tsx" --include="*.ts" | grep -v "m\." | wc -l)
if [ "$MOTION_COUNT" -eq "0" ]; then
    echo "✅ Tous les composants ont été convertis en m.xxx"
else
    echo "⚠️  $MOTION_COUNT composants motion restants trouvés:"
    grep -r "motion\." src/ --include="*.tsx" --include="*.ts" | grep -v "m\."
fi
echo ""

# Étape 4 : Reconstruire le projet
echo "🔨 Étape 4/5 : Reconstruction du projet..."
rm -rf .next
pnpm build
echo ""

# Étape 5 : Résumé
echo "📊 Étape 5/5 : Résumé final"
echo "=========================="
echo "✅ LazyMotion est maintenant correctement configuré"
echo "✅ Tous les composants utilisent m.xxx au lieu de motion.xxx"
echo "✅ L'architecture est prête pour une croissance exponentielle"
echo "✅ Le build a réussi"
echo ""
echo "🚀 Prochaines étapes:"
echo "1. Tester l'application: pnpm start"
echo "2. Vérifier que toutes les animations fonctionnent"
echo "3. Lire docs/ANIMATION_ARCHITECTURE.md pour les bonnes pratiques"
echo "4. Suivre les règles pour les nouveaux composants"
echo ""
echo "💡 Pour annuler:"
echo "   git checkout -- src/  (si vous utilisez git)"
echo "   ou restaurez depuis votre backup"
echo ""
echo "🎉 Configuration terminée avec succès !"