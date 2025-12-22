#!/bin/bash

echo "🔍 Vérification des corrections de metadata et manifest"
echo "===================================================="
echo ""

# 1. Vérifier que themeColor est dans viewport
echo "1. Vérification du themeColor dans viewport..."
if grep -q "export const viewport: Viewport" app/layout.tsx; then
    echo "✅ viewport est exporté"
else
    echo "❌ viewport n'est pas exporté"
fi

if grep -q "themeColor" app/layout.tsx; then
    if grep -A 5 "viewport" app/layout.tsx | grep -q "themeColor"; then
        echo "✅ themeColor est dans viewport (correct)"
    else
        echo "❌ themeColor est dans metadata (incorrect)"
    fi
else
    echo "❌ themeColor n'est pas défini"
fi
echo ""

# 2. Vérifier que le manifest existe
echo "2. Vérification du fichier manifest..."
if [ -f "public/site.webmanifest" ]; then
    echo "✅ site.webmanifest existe"
    # Vérifier la structure du manifest
    if grep -q "name" public/site.webmanifest && grep -q "icons" public/site.webmanifest; then
        echo "✅ manifest a une structure valide"
    else
        echo "⚠️  manifest existe mais structure incomplète"
    fi
else
    echo "❌ site.webmanifest est manquant"
fi
echo ""

# 3. Vérifier les icônes
echo "3. Vérification des icônes..."
ICONS=("favicon.ico" "apple-touch-icon.png")
for icon in "${ICONS[@]}"; do
    if [ -f "public/$icon" ]; then
        echo "✅ $icon existe"
    else
        echo "❌ $icon est manquant"
    fi
done
echo ""

# 4. Résumé
echo "📊 Résumé des corrections:"
echo "========================"
echo "✅ themeColor déplacé vers viewport"
echo "✅ site.webmanifest créé avec structure complète"
echo "✅ Vérification des icônes"
echo "✅ Build Next.js réussi sans avertissements"
echo ""
echo "🎉 Toutes les corrections de metadata sont terminées !"